mod models;
mod db;
mod accounting;
mod inventory;
mod storage;
mod commands;
pub mod transfer;
pub mod importer;
#[cfg(test)]
mod tests;

use std::sync::Mutex;
use rusqlite::Connection;
use storage::PathManager;
use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let path_mgr = PathManager::new();
    let db_path = path_mgr.database_path();

    let conn = Connection::open(&db_path).expect("Failed to open SQLite company database");
    db::run_migrations(&conn).expect("Failed to run SQLite database migrations");

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .manage(AppState {
            db: Mutex::new(conn),
            storage: Mutex::new(path_mgr),
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_storage_status,
            commands::backup_database,
            commands::safe_eject,
            commands::resolve_document_path,
            commands::export_transfer_package,
            commands::validate_transfer_package,
            commands::import_transfer_package,
            commands::import_legacy_data,
            commands::get_company,
            commands::save_company,
            commands::list_customers,
            commands::create_customer,
            commands::list_suppliers,
            commands::create_supplier,
            commands::list_products,
            commands::create_product,
            commands::post_sale,
            commands::post_purchase,
            commands::get_dashboard_metrics,
            commands::get_trial_balance
        ])
        .run(tauri::generate_context!())
        .expect("error while running SDL ACC desktop application");
}
