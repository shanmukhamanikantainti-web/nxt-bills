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
    pub imports_directory: String,
    pub exports_directory: String,
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
    database_dir: PathBuf,
    documents_dir: PathBuf,
    imports_dir: PathBuf,
    exports_dir: PathBuf,
    backups_dir: PathBuf,
    config_dir: PathBuf,
    logs_dir: PathBuf,
    temp_dir: PathBuf,
}

impl PathManager {
    /// Construct the PathManager dynamically based on portable detection:
    /// - Checks for `portable.flag` adjacent to the executable, in ../Config, or in current dir.
    /// - If present => Portable Mode: All data directories resolve relative to the portable root.
    /// - If absent => Installed Mode: Separates application binaries from user accounting data in `%LOCALAPPDATA%\SDL_ACC` or `%USERPROFILE%\Documents\SDL_ACC`.
    pub fn new() -> Self {
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| PathBuf::from("."));

        // Check for portable indicator in:
        // 1. Same directory as executable (App/portable.flag or root portable.flag)
        // 2. Parent directory Config/portable.flag
        // 3. Current working directory Config/portable.flag or portable.flag
        let is_portable = exe_dir.join("portable.flag").exists()
            || exe_dir.join("Config").join("portable.flag").exists()
            || exe_dir.parent().map(|p| p.join("Config").join("portable.flag").exists()).unwrap_or(false)
            || exe_dir.parent().map(|p| p.join("portable.flag").exists()).unwrap_or(false)
            || Path::new("Config").join("portable.flag").exists()
            || Path::new("portable.flag").exists();

        let root_dir = if is_portable {
            if exe_dir.ends_with("App") {
                exe_dir.parent().map(|p| p.to_path_buf()).unwrap_or(exe_dir)
            } else {
                exe_dir
            }
        } else {
            exe_dir
        };

        Self::init_with_mode(root_dir, is_portable)
    }

    /// Internal initialization with explicit mode for testing and runtime
    pub fn init_with_mode(root_dir: PathBuf, is_portable: bool) -> Self {
        let (mode, app_root, data_root, config_root) = if is_portable {
            (
                DeploymentMode::Portable,
                root_dir.join("App"),
                root_dir.join("Data"),
                root_dir.join("Config"),
            )
        } else {
            // Installed mode: User Data kept safe from application binary updates
            let data_root = if let Ok(local_appdata) = std::env::var("LOCALAPPDATA") {
                PathBuf::from(local_appdata).join("SDL_ACC")
            } else if let Ok(user_profile) = std::env::var("USERPROFILE") {
                PathBuf::from(user_profile).join("Documents").join("SDL_ACC")
            } else {
                PathBuf::from(".").join("SDL_ACC_Data")
            };

            (
                DeploymentMode::Installed,
                root_dir.clone(),
                data_root.join("Data"),
                data_root.join("Config"),
            )
        };

        let database_dir = data_root.join("Database");
        let documents_dir = data_root.join("Documents");
        let imports_dir = data_root.join("Imports");
        let exports_dir = data_root.join("Exports");
        let backups_dir = data_root.join("Backups");
        let config_dir = config_root;
        let logs_dir = if is_portable { root_dir.join("Logs") } else { data_root.join("Logs") };
        let temp_dir = if is_portable { root_dir.join("Temp") } else { data_root.join("Temp") };

        let manager = PathManager {
            mode,
            app_root,
            data_dir: data_root,
            database_dir,
            documents_dir,
            imports_dir,
            exports_dir,
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
        let _ = fs::create_dir_all(&self.database_dir);
        let _ = fs::create_dir_all(&self.documents_dir.join("Sales"));
        let _ = fs::create_dir_all(&self.documents_dir.join("Purchases"));
        let _ = fs::create_dir_all(&self.documents_dir.join("DebitNotes"));
        let _ = fs::create_dir_all(&self.documents_dir.join("CreditNotes"));
        let _ = fs::create_dir_all(&self.documents_dir.join("Other"));
        let _ = fs::create_dir_all(&self.imports_dir.join("Legacy"));
        let _ = fs::create_dir_all(&self.imports_dir.join("Processed"));
        let _ = fs::create_dir_all(&self.exports_dir);
        let _ = fs::create_dir_all(&self.backups_dir);
        let _ = fs::create_dir_all(&self.config_dir);
        let _ = fs::create_dir_all(&self.logs_dir);
        let _ = fs::create_dir_all(&self.temp_dir);

        // Ensure legacy path compatibility: if old Data/company.sqlite exists, migrate to Database/company.sqlite
        let old_db = self.data_dir.join("company.sqlite");
        let new_db = self.database_dir.join("company.sqlite");
        if old_db.exists() && !new_db.exists() {
            let _ = fs::rename(&old_db, &new_db);
        }
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

    pub fn database_directory(&self) -> &Path {
        &self.database_dir
    }

    pub fn database_path(&self) -> PathBuf {
        self.database_dir.join("company.sqlite")
    }

    pub fn documents_directory(&self) -> &Path {
        &self.documents_dir
    }

    pub fn imports_directory(&self) -> &Path {
        &self.imports_dir
    }

    pub fn exports_directory(&self) -> &Path {
        &self.exports_dir
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

    /// Resolves a logical/relative document path (e.g. "Sales/INV001.pdf" or "Documents/Sales/INV001.pdf")
    /// against current documents root. Never stores absolute paths or drive letters in database.
    pub fn resolve_document_path(&self, relative_path: &str) -> Result<PathBuf, String> {
        let clean_path = relative_path.replace('\\', "/");
        if clean_path.starts_with('/') || clean_path.contains("..") {
            return Err("Invalid document path: directory traversal attempt rejected".to_string());
        }

        let stripped = clean_path.strip_prefix("Documents/").unwrap_or(&clean_path);
        let full_path = self.documents_dir.join(stripped);
        Ok(full_path)
    }

    /// Converts an absolute file path into a relative document path for portable database storage.
    pub fn to_relative_document_path(&self, full_path: &Path) -> Result<String, String> {
        match full_path.strip_prefix(&self.documents_dir) {
            Ok(rel) => Ok(format!("Documents/{}", rel.to_string_lossy().replace('\\', "/"))),
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
            imports_directory: self.imports_dir.to_string_lossy().to_string(),
            exports_directory: self.exports_dir.to_string_lossy().to_string(),
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
