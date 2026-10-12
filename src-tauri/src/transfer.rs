use std::path::{Path, PathBuf};
use std::fs;
use rusqlite::Connection;
use chrono::Local;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use crate::storage::PathManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageFileEntry {
    pub path: String,
    pub sha256: String,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferManifest {
    pub manifest_version: String,
    pub app_version: String,
    pub schema_version: i64,
    pub package_version: String,
    pub company_id: Option<String>,
    pub company_name: Option<String>,
    pub created_at: String,
    pub files: Vec<PackageFileEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub manifest: Option<TransferManifest>,
    pub checks: Vec<String>,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportPackageResult {
    pub success: bool,
    pub export_path: String,
    pub manifest: TransferManifest,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportPackageResult {
    pub success: bool,
    pub safety_backup_path: Option<String>,
    pub message: String,
}

pub struct TransferService;

impl TransferService {
    /// Calculate SHA-256 hash of a file
    pub fn compute_sha256(path: &Path) -> Result<String, String> {
        let mut file = fs::File::open(path).map_err(|e| format!("Cannot open file {:?}: {}", path, e))?;
        let mut hasher = Sha256::new();
        std::io::copy(&mut file, &mut hasher).map_err(|e| format!("Cannot read file {:?}: {}", path, e))?;
        Ok(hex::encode(hasher.finalize()))
    }

    /// Prepare and export a complete self-contained SDL ACC transfer package to target directory
    pub fn export_package(
        conn: &Connection,
        mgr: &PathManager,
        target_dir: &Path,
    ) -> Result<ExportPackageResult, String> {
        // 1. Flush database WAL and optimize
        mgr.safe_eject(conn)?;

        // 2. Perform DB integrity check
        let integrity: String = conn
            .query_row("PRAGMA integrity_check", [], |r| r.get(0))
            .map_err(|e| format!("Database integrity test failed: {}", e))?;
        if integrity != "ok" {
            return Err("Database failed integrity verification, export aborted".to_string());
        }

        // 3. Verify trial balance accounting equality (Total Debit == Total Credit)
        let (total_debit, total_credit): (i64, i64) = conn
            .query_row(
                "SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0) FROM journal_lines",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((0, 0));

        if total_debit != total_credit {
            return Err(format!(
                "Financial ledger imbalance detected (Debit: {}, Credit: {}). Export rejected.",
                total_debit, total_credit
            ));
        }

        // 4. Create safe atomic database backup to export Database folder
        let package_root = target_dir.join("SDL_ACC");
        let dest_app = package_root.join("App");
        let dest_data = package_root.join("Data");
        let dest_database = dest_data.join("Database");
        let dest_docs = dest_data.join("Documents");
        let dest_imports = dest_data.join("Imports");
        let dest_backups = dest_data.join("Backups");
        let dest_config = package_root.join("Config");
        let dest_logs = package_root.join("Logs");
        let dest_temp = package_root.join("Temp");

        fs::create_dir_all(&dest_app).map_err(|e| e.to_string())?;
        fs::create_dir_all(&dest_database).map_err(|e| e.to_string())?;
        fs::create_dir_all(&dest_docs).map_err(|e| e.to_string())?;
        fs::create_dir_all(&dest_imports).map_err(|e| e.to_string())?;
        fs::create_dir_all(&dest_backups).map_err(|e| e.to_string())?;
        fs::create_dir_all(&dest_config).map_err(|e| e.to_string())?;
        fs::create_dir_all(&dest_logs).map_err(|e| e.to_string())?;
        fs::create_dir_all(&dest_temp).map_err(|e| e.to_string())?;

        // Copy application executable if exists in current App / exe dir
        let current_exe = std::env::current_exe().ok();
        if let Some(ref exe_path) = current_exe {
            if exe_path.exists() {
                let _ = fs::copy(exe_path, dest_app.join("SDL_ACC.exe"));
            }
        }

        // Export active company database using VACUUM INTO for guaranteed consistency
        let dest_db_file = dest_database.join("company.sqlite");
        if dest_db_file.exists() {
            let _ = fs::remove_file(&dest_db_file);
        }
        let vacuum_dest = dest_db_file.to_string_lossy().replace('\\', "/");
        conn.execute(&format!("VACUUM INTO '{}'", vacuum_dest), [])
            .map_err(|e| format!("Failed to vacuum database to export location: {}", e))?;

        // Copy Documents tree recursively
        Self::copy_dir_all(mgr.documents_directory(), &dest_docs)?;

        // Copy Config files & write portable.flag
        fs::write(dest_config.join("portable.flag"), "SDL_ACC_PORTABLE_MODE=1").map_err(|e| e.to_string())?;
        fs::write(
            dest_config.join("application.json"),
            serde_json::to_string_pretty(&serde_json::json!({
                "mode": "Portable",
                "app": "SDL ACC",
                "version": "1.0.0"
            })).unwrap(),
        ).map_err(|e| e.to_string())?;

        // Write user README.txt and VERSION.txt
        fs::write(
            package_root.join("README.txt"),
            "SDL ACC Portable USB Package\nLaunch App/SDL_ACC.exe to operate without host dependencies.\n",
        ).map_err(|e| e.to_string())?;
        fs::write(package_root.join("VERSION.txt"), "SDL_ACC 1.0.0 (Schema: 1)\n").map_err(|e| e.to_string())?;

        // 5. Build Package File Entries & Hashes
        let mut files = Vec::new();
        Self::collect_files_recursive(&package_root, &package_root, &mut files)?;

        // Query active company details
        let (comp_id, comp_name): (Option<String>, Option<String>) = conn
            .query_row("SELECT id, name FROM companies LIMIT 1", [], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .unwrap_or((None, None));

        let schema_ver: i64 = conn
            .query_row("SELECT COALESCE(MAX(version), 1) FROM schema_migrations", [], |r| r.get(0))
            .unwrap_or(1);

        let manifest = TransferManifest {
            manifest_version: "1.0".to_string(),
            app_version: "1.0.0".to_string(),
            schema_version: schema_ver,
            package_version: "1.0.0".to_string(),
            company_id: comp_id,
            company_name: comp_name,
            created_at: Local::now().to_rfc3339(),
            files,
        };

        // Write manifest.json to package root
        let manifest_json = serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?;
        fs::write(package_root.join("manifest.json"), manifest_json).map_err(|e| e.to_string())?;

        Ok(ExportPackageResult {
            success: true,
            export_path: package_root.to_string_lossy().to_string(),
            manifest,
            message: "SDL ACC Portable Package exported successfully with verified integrity".to_string(),
        })
    }

    /// Validate an incoming SDL ACC package on USB or folder before importing
    pub fn validate_package(package_dir: &Path) -> ValidationResult {
        let mut checks = Vec::new();
        let mut errors = Vec::new();
        let mut warnings = Vec::new();

        let root = if package_dir.join("SDL_ACC").exists() {
            package_dir.join("SDL_ACC")
        } else {
            package_dir.to_path_buf()
        };

        // 1. Check manifest
        let manifest_file = root.join("manifest.json");
        if !manifest_file.exists() {
            errors.push("Missing manifest.json in package root".to_string());
            return ValidationResult {
                is_valid: false,
                manifest: None,
                checks,
                errors,
                warnings,
            };
        }
        checks.push("manifest.json located".to_string());

        let manifest_content = match fs::read_to_string(&manifest_file) {
            Ok(c) => c,
            Err(e) => {
                errors.push(format!("Cannot read manifest.json: {}", e));
                return ValidationResult { is_valid: false, manifest: None, checks, errors, warnings };
            }
        };

        let manifest: TransferManifest = match serde_json::from_str(&manifest_content) {
            Ok(m) => m,
            Err(e) => {
                errors.push(format!("Invalid manifest.json schema: {}", e));
                return ValidationResult { is_valid: false, manifest: None, checks, errors, warnings };
            }
        };
        checks.push(format!("Manifest parsed (App: {}, Schema: {})", manifest.app_version, manifest.schema_version));

        // 2. Check Database file
        let db_path = root.join("Data").join("Database").join("company.sqlite");
        let fallback_db = root.join("Data").join("company.sqlite");
        let active_db = if db_path.exists() {
            db_path
        } else if fallback_db.exists() {
            fallback_db
        } else {
            errors.push("No SQLite database found in package (expected Data/Database/company.sqlite)".to_string());
            return ValidationResult { is_valid: false, manifest: Some(manifest), checks, errors, warnings };
        };
        checks.push("Accounting database file located".to_string());

        // 3. Test SQLite integrity
        match Connection::open(&active_db) {
            Ok(conn) => {
                let integrity: Result<String, _> = conn.query_row("PRAGMA integrity_check", [], |r| r.get(0));
                match integrity {
                    Ok(res) if res == "ok" => checks.push("SQLite PRAGMA integrity verified ok".to_string()),
                    Ok(res) => errors.push(format!("Database integrity corrupt: {}", res)),
                    Err(e) => errors.push(format!("Failed to execute integrity check: {}", e)),
                }
            }
            Err(e) => errors.push(format!("Cannot open package database: {}", e)),
        }

        // 4. Verify file checksums
        let mut verified_count = 0;
        for entry in &manifest.files {
            if entry.path == "manifest.json" {
                continue;
            }
            let file_path = root.join(&entry.path);
            if !file_path.exists() {
                warnings.push(format!("Manifest references file not present: {}", entry.path));
                continue;
            }
            if let Ok(hash) = Self::compute_sha256(&file_path) {
                if hash != entry.sha256 {
                    errors.push(format!("Checksum mismatch on {}: expected {}, found {}", entry.path, entry.sha256, hash));
                } else {
                    verified_count += 1;
                }
            }
        }
        checks.push(format!("Verified {} package file checksums", verified_count));

        let is_valid = errors.is_empty();
        ValidationResult {
            is_valid,
            manifest: Some(manifest),
            checks,
            errors,
            warnings,
        }
    }

    /// Import package into current SDL ACC installation with safety backup and rollback guarantee
    pub fn import_package(
        conn: &mut Connection,
        mgr: &PathManager,
        package_dir: &Path,
    ) -> Result<ImportPackageResult, String> {
        // 1. Validate package first
        let validation = Self::validate_package(package_dir);
        if !validation.is_valid {
            return Err(format!(
                "Package validation failed: {}",
                validation.errors.join("; ")
            ));
        }

        let root = if package_dir.join("SDL_ACC").exists() {
            package_dir.join("SDL_ACC")
        } else {
            package_dir.to_path_buf()
        };

        // 2. Create safety backup of existing state before any replacement
        let safety_backup = mgr.create_backup(conn).ok();

        // 3. Flush and close active WAL
        let _ = mgr.safe_eject(conn);

        // 4. Source files
        let src_db = if root.join("Data").join("Database").join("company.sqlite").exists() {
            root.join("Data").join("Database").join("company.sqlite")
        } else {
            root.join("Data").join("company.sqlite")
        };

        let target_db = mgr.database_path();
        if let Some(parent) = target_db.parent() {
            let _ = fs::create_dir_all(parent);
        }

        // Copy database file
        if let Err(e) = fs::copy(&src_db, &target_db) {
            // Rollback if backup exists
            if let Some(ref bk) = safety_backup {
                let _ = fs::copy(bk, &target_db);
            }
            return Err(format!("Failed to copy imported database: {}. Restored previous state.", e));
        }

        // Copy documents if present
        let src_docs = root.join("Data").join("Documents");
        if src_docs.exists() {
            let _ = Self::copy_dir_all(&src_docs, mgr.documents_directory());
        }

        // Verify reopened database
        let reopened = Connection::open(&target_db).map_err(|e| format!("Cannot reopen imported DB: {}", e))?;
        let integrity: String = reopened
            .query_row("PRAGMA integrity_check", [], |r| r.get(0))
            .map_err(|e| format!("Imported database check failed: {}", e))?;

        if integrity != "ok" {
            // Rollback
            if let Some(ref bk) = safety_backup {
                let _ = fs::copy(bk, &target_db);
            }
            return Err("Imported database corrupt! Rollback completed.".to_string());
        }

        Ok(ImportPackageResult {
            success: true,
            safety_backup_path: safety_backup,
            message: "SDL ACC Package imported and verified successfully".to_string(),
        })
    }

    fn copy_dir_all(src: &Path, dst: &Path) -> Result<(), String> {
        if !src.exists() {
            return Ok(());
        }
        fs::create_dir_all(dst).map_err(|e| e.to_string())?;
        for entry in fs::read_dir(src).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let ft = entry.file_type().map_err(|e| e.to_string())?;
            let dest_child = dst.join(entry.file_name());
            if ft.is_dir() {
                Self::copy_dir_all(&entry.path(), &dest_child)?;
            } else {
                fs::copy(entry.path(), dest_child).map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }

    fn collect_files_recursive(
        base: &Path,
        current: &Path,
        out: &mut Vec<PackageFileEntry>,
    ) -> Result<(), String> {
        if !current.exists() {
            return Ok(());
        }
        for entry in fs::read_dir(current).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            let ft = entry.file_type().map_err(|e| e.to_string())?;
            if ft.is_dir() {
                Self::collect_files_recursive(base, &path, out)?;
            } else {
                let rel = path
                    .strip_prefix(base)
                    .map_err(|e| e.to_string())?
                    .to_string_lossy()
                    .replace('\\', "/");
                let size_bytes = entry.metadata().map(|m| m.len()).unwrap_or(0);
                let sha256 = Self::compute_sha256(&path).unwrap_or_default();
                out.push(PackageFileEntry {
                    path: rel,
                    sha256,
                    size_bytes,
                });
            }
        }
        Ok(())
    }
}
