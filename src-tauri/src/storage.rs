use std::path::{Path, PathBuf};
use std::fs;
use rusqlite::Connection;
use chrono::Local;

#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum DeploymentMode {
    Installed,
    Portable,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StorageInfo {
    pub mode: DeploymentMode,
    pub application_root: String,
    pub data_directory: String,
    pub database_path: String,
    pub documents_directory: String,
    pub backups_directory: String,
    pub config_directory: String,
    pub logs_directory: String,
    pub temp_directory: String,
    pub is_usb_portable: bool,
    pub is_connected: bool,
    pub last_checked: String,
}

/// Centralized PathManager according to SDL ACC Deployment & Portability Architecture
pub struct PathManager {
    mode: DeploymentMode,
    app_root: PathBuf,
    data_dir: PathBuf,
    documents_dir: PathBuf,
    backups_dir: PathBuf,
    config_dir: PathBuf,
    logs_dir: PathBuf,
    temp_dir: PathBuf,
}

impl PathManager {
    /// Construct the PathManager dynamically based on portable detection:
    /// - Checks for `portable.flag` adjacent to the executable or in current dir.
    /// - If present => Portable Mode: All data directories resolve relative to the portable root.
    /// - If absent => Installed Mode: Separates application binaries from user accounting data in `%LOCALAPPDATA%\SDL_ACC` or `%USERPROFILE%\Documents\SDL_ACC`.
    pub fn new() -> Self {
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| PathBuf::from("."));

        // Check for portable indicator
        let is_portable = exe_dir.join("portable.flag").exists()
            || Path::new("portable.flag").exists()
            || exe_dir.join("portable.txt").exists()
            || Path::new("portable.txt").exists();

        Self::init_with_mode(exe_dir, is_portable)
    }

    /// Internal initialization with explicit mode for testing and runtime
    pub fn init_with_mode(exe_dir: PathBuf, is_portable: bool) -> Self {
        let (mode, app_root, data_root) = if is_portable {
            let root = exe_dir.clone();
            (DeploymentMode::Portable, root.clone(), root)
        } else {
            // Installed mode: User Data kept safe from application binary updates
            let data_root = if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
                PathBuf::from(local_appdata).join("SDL_ACC")
            } else if let Ok(user_profile) = std::env::var("USERPROFILE") {
                PathBuf::from(user_profile).join("Documents").join("SDL_ACC")
            } else {
                PathBuf::from(".").join("SDL_ACC_Data")
            };

            (DeploymentMode::Installed, exe_dir, data_root)
        };

        let data_dir = data_root.join("Data");
        let documents_dir = data_root.join("Documents");
        let backups_dir = data_root.join("Backups");
        let config_dir = data_root.join("Config");
        let logs_dir = data_root.join("Logs");
        let temp_dir = data_root.join("Temp");

        let manager = PathManager {
            mode,
            app_root,
            data_dir,
            documents_dir,
            backups_dir,
            config_dir,
            logs_dir,
            temp_dir,
        };

        manager.ensure_directories();
        manager
    }

    /// Ensure required data directories exist
    pub fn ensure_directories(&self) {
        let _ = fs::create_dir_all(&self.data_dir);
        let _ = fs::create_dir_all(&self.documents_dir.join("Sales"));
        let _ = fs::create_dir_all(&self.documents_dir.join("Purchases"));
        let _ = fs::create_dir_all(&self.documents_dir.join("DebitNotes"));
        let _ = fs::create_dir_all(&self.documents_dir.join("CreditNotes"));
        let _ = fs::create_dir_all(&self.backups_dir);
        let _ = fs::create_dir_all(&self.config_dir);
        let _ = fs::create_dir_all(&self.logs_dir);
        let _ = fs::create_dir_all(&self.temp_dir);
    }

    pub fn mode(&self) -> &DeploymentMode {
        &self.mode
    }

    pub fn application_root(&self) -> &Path {
        &self.app_root
    }

    pub fn data_directory(&self) -> &Path {
        &self.data_dir
    }

    pub fn database_path(&self) -> PathBuf {
        self.data_dir.join("company.sqlite")
    }

    pub fn documents_directory(&self) -> &Path {
        &self.documents_dir
    }

    pub fn backups_directory(&self) -> &Path {
        &self.backups_dir
    }

    pub fn config_directory(&self) -> &Path {
        &self.config_dir
    }

    pub fn logs_directory(&self) -> &Path {
        &self.logs_dir
    }

    pub fn temp_directory(&self) -> &Path {
        &self.temp_dir
    }

    /// Resolves a logical/relative document path (e.g. "Sales/INV001.pdf") against current documents root.
    /// Never stores absolute paths or drive letters in database.
    /// Prevents directory traversal attacks.
    pub fn resolve_document_path(&self, relative_path: &str) -> Result<PathBuf, String> {
        let clean_path = relative_path.replace('\\', "/");
        if clean_path.starts_with('/') || clean_path.contains("..") {
            return Err("Invalid document path: directory traversal attempt rejected".to_string());
        }

        let full_path = self.documents_dir.join(clean_path);
        Ok(full_path)
    }

    /// Converts an absolute file path into a relative document path for portable database storage.
    pub fn to_relative_document_path(&self, full_path: &Path) -> Result<String, String> {
        match full_path.strip_prefix(&self.documents_dir) {
            Ok(rel) => Ok(rel.to_string_lossy().replace('\\', "/")),
            Err(_) => Err("Path is not within SDL ACC documents directory".to_string()),
        }
    }

    pub fn get_storage_info(&self) -> StorageInfo {
        let db_path = self.database_path();
        let is_connected = self.data_dir.exists();
        let is_usb_portable = self.mode == DeploymentMode::Portable;

        StorageInfo {
            mode: self.mode.clone(),
            application_root: self.app_root.to_string_lossy().to_string(),
            data_directory: self.data_dir.to_string_lossy().to_string(),
            database_path: db_path.to_string_lossy().to_string(),
            documents_directory: self.documents_dir.to_string_lossy().to_string(),
            backups_directory: self.backups_dir.to_string_lossy().to_string(),
            config_directory: self.config_dir.to_string_lossy().to_string(),
            logs_directory: self.logs_dir.to_string_lossy().to_string(),
            temp_directory: self.temp_dir.to_string_lossy().to_string(),
            is_usb_portable,
            is_connected,
            last_checked: Local::now().to_rfc3339(),
        }
    }

    /// Perform safe atomic backup using SQLite `VACUUM INTO` and verify PRAGMA integrity
    pub fn create_backup(&self, conn: &Connection) -> Result<String, String> {
        fs::create_dir_all(&self.backups_dir).map_err(|e| e.to_string())?;

        let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
        let backup_file = self.backups_dir.join(format!("SDL_ACC_backup_{}.sqlite", timestamp));
        let backup_str = backup_file.to_string_lossy().to_string();

        // Perform safe atomic VACUUM INTO backup
        conn.execute(&format!("VACUUM INTO '{}'", backup_str.replace('\\', "/")), [])
            .map_err(|e| format!("Backup failed: {}", e))?;

        // Verify backup integrity
        let backup_conn = Connection::open(&backup_file).map_err(|e| format!("Cannot open backup: {}", e))?;
        let integrity: String = backup_conn
            .query_row("PRAGMA integrity_check", [], |r| r.get(0))
            .map_err(|e| format!("Backup integrity test failed: {}", e))?;

        if integrity != "ok" {
            let _ = fs::remove_file(&backup_file);
            return Err("Backup file failed integrity verification!".to_string());
        }

        Ok(backup_str)
    }

    /// Flush database WAL and optimize prior to unmount / safe shutdown
    pub fn safe_eject(&self, conn: &Connection) -> Result<(), String> {
        conn.execute_batch("
            PRAGMA wal_checkpoint(TRUNCATE);
            PRAGMA optimize;
        ").map_err(|e| format!("Failed to flush database to disk: {}", e))?;

        Ok(())
    }
}
