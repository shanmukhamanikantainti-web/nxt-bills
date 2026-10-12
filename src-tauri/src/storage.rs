use std::path::{Path, PathBuf};
use std::fs;
use rusqlite::Connection;
use chrono::Local;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct StorageInfo {
    pub base_path: String,
    pub db_path: String,
    pub is_usb_portable: bool,
    pub is_connected: bool,
    pub last_checked: String,
}

pub struct StorageManager {
    base_dir: PathBuf,
}

impl StorageManager {
    pub fn new() -> Self {
        // Check for portable USB marker or executable path
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| PathBuf::from("."));

        let portable_marker = exe_dir.join("portable.txt");
        let base_dir = if portable_marker.exists() || exe_dir.join("Data").exists() {
            exe_dir
        } else {
            let user_profile = std::env::var("USERPROFILE").unwrap_or_else(|_| ".".to_string());
            PathBuf::from(user_profile).join("Documents").join("SDL_ACC")
        };

        // Ensure subdirectories exist
        let _ = fs::create_dir_all(base_dir.join("Data"));
        let _ = fs::create_dir_all(base_dir.join("Documents").join("Sales"));
        let _ = fs::create_dir_all(base_dir.join("Documents").join("Purchases"));
        let _ = fs::create_dir_all(base_dir.join("Documents").join("DebitNotes"));
        let _ = fs::create_dir_all(base_dir.join("Documents").join("CreditNotes"));
        let _ = fs::create_dir_all(base_dir.join("Backups"));

        StorageManager { base_dir }
    }

    pub fn get_db_path(&self) -> PathBuf {
        self.base_dir.join("Data").join("company.sqlite")
    }

    pub fn get_storage_info(&self) -> StorageInfo {
        let db_path = self.get_db_path();
        let is_connected = self.base_dir.exists() && self.base_dir.is_dir();
        let is_usb_portable = self.base_dir.join("portable.txt").exists();

        StorageInfo {
            base_path: self.base_dir.to_string_lossy().to_string(),
            db_path: db_path.to_string_lossy().to_string(),
            is_usb_portable,
            is_connected,
            last_checked: Local::now().to_rfc3339(),
        }
    }

    pub fn create_backup(&self, conn: &Connection) -> Result<String, String> {
        let backups_dir = self.base_dir.join("Backups");
        fs::create_dir_all(&backups_dir).map_err(|e| e.to_string())?;

        let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
        let backup_file = backups_dir.join(format!("SDL_ACC_backup_{}.sqlite", timestamp));
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

    pub fn safe_eject(&self, conn: &Connection) -> Result<(), String> {
        // Checkpoint WAL and optimize database before releasing handles
        conn.execute_batch("
            PRAGMA wal_checkpoint(TRUNCATE);
            PRAGMA optimize;
        ").map_err(|e| format!("Failed to flush database to disk: {}", e))?;

        Ok(())
    }
}
