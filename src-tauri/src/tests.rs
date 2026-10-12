#[cfg(test)]
mod tests {
    use rusqlite::Connection;
    use crate::db;
    use crate::accounting;
    use crate::inventory;

    #[test]
    fn test_accounting_double_entry_balance_enforcement() {
        let conn = Connection::open_in_memory().unwrap();
        db::run_migrations(&conn).unwrap();

        // 1. Unbalanced entry must fail
        let unbalanced = vec![
            ("acc1".to_string(), 1000, 0, None),
            ("acc2".to_string(), 0, 950, None),
        ];
        let result = accounting::post_journal_entry(
            &conn, "comp1", None, "Journal", "JV-01", "2026-10-12", None, None, &unbalanced
        );
        assert!(result.is_err(), "Accounting engine must reject unbalanced debit/credit");

        // 2. Zero or negative transaction amount must fail
        let zero = vec![
            ("acc1".to_string(), 0, 0, None),
            ("acc2".to_string(), 0, 0, None),
        ];
        let zero_res = accounting::post_journal_entry(
            &conn, "comp1", None, "Journal", "JV-02", "2026-10-12", None, None, &zero
        );
        assert!(zero_res.is_err(), "Transaction with zero amount must be rejected");
    }

    #[test]
    fn test_inventory_stock_balance_constraint() {
        let conn = Connection::open_in_memory().unwrap();
        db::run_migrations(&conn).unwrap();

        // Seed company & test product
        conn.execute(
            "INSERT INTO companies (id, name, currency_symbol, currency_code, created_at, updated_at) 
             VALUES ('comp1', 'Test Company', '₹', 'INR', '2026-10-12', '2026-10-12')",
            [],
        ).unwrap();

        conn.execute(
            "INSERT INTO products (id, company_id, name, code, purchase_price, selling_price, current_stock, reorder_level, is_active, created_at)
             VALUES ('prod1', 'comp1', 'Item 1', 'I01', 1000, 1500, 5.0, 2.0, 1, '2026-10-12')",
            [],
        ).unwrap();

        // Stock OUT of 10 when stock is 5 must fail with insufficient stock
        let overdraw = inventory::record_stock_movement(
            &conn, "comp1", "prod1", "SALE", "SALES_INVOICE", "inv1", "2026-10-12", 0.0, 10.0, 1500, None
        );
        assert!(overdraw.is_err(), "Inventory engine must reject negative stock sale");

        // Stock OUT of 3 must succeed and leave 2
        let valid_sale = inventory::record_stock_movement(
            &conn, "comp1", "prod1", "SALE", "SALES_INVOICE", "inv2", "2026-10-12", 0.0, 3.0, 1500, None
        );
        assert!(valid_sale.is_ok());
        assert_eq!(valid_sale.unwrap(), 2.0);

        // Verify stock transaction audit record exists
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM stock_transactions WHERE product_id = 'prod1'",
            [],
            |r| r.get(0),
        ).unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_path_manager_portable_and_installed_modes() {
        use crate::storage::{PathManager, DeploymentMode};
        use std::path::PathBuf;

        // 1. Test Portable Mode
        let temp_usb_dir = std::env::temp_dir().join("SDL_ACC_Test_USB");
        let portable_mgr = PathManager::init_with_mode(temp_usb_dir.clone(), true);
        assert_eq!(portable_mgr.mode(), &DeploymentMode::Portable);
        assert_eq!(portable_mgr.data_directory(), temp_usb_dir.join("Data"));
        assert_eq!(portable_mgr.database_path(), temp_usb_dir.join("Data").join("company.sqlite"));

        // 2. Test Installed Mode
        let app_dir = PathBuf::from("C:\\Program Files\\SDL_ACC");
        let installed_mgr = PathManager::init_with_mode(app_dir.clone(), false);
        assert_eq!(installed_mgr.mode(), &DeploymentMode::Installed);
        // Data directory should be isolated from Program Files
        assert_ne!(installed_mgr.data_directory(), app_dir.join("Data"));

        // 3. Test relative document path resolution and traversal prevention
        let sales_doc = portable_mgr.resolve_document_path("Sales/INV001.pdf").unwrap();
        assert_eq!(sales_doc, temp_usb_dir.join("Documents").join("Sales/INV001.pdf"));

        // Path traversal must be rejected
        let traversal = portable_mgr.resolve_document_path("../secret.key");
        assert!(traversal.is_err(), "Must reject path traversal");

        // 4. Test drive letter independence: same logical document path resolves correctly across drives
        let drive_e = PathBuf::from("E:\\SDL_ACC_Portable");
        let drive_f = PathBuf::from("F:\\SDL_ACC_Portable");
        let mgr_e = PathManager::init_with_mode(drive_e.clone(), true);
        let mgr_f = PathManager::init_with_mode(drive_f.clone(), true);

        let doc_e = mgr_e.resolve_document_path("Sales/INV001.pdf").unwrap();
        let doc_f = mgr_f.resolve_document_path("Sales/INV001.pdf").unwrap();

        assert_eq!(doc_e, drive_e.join("Documents").join("Sales/INV001.pdf"));
        assert_eq!(doc_f, drive_f.join("Documents").join("Sales/INV001.pdf"));
    }

    #[test]
    fn test_database_backup_integrity_and_portability() {
        use crate::storage::PathManager;

        let temp_dir = std::env::temp_dir().join(format!("SDL_ACC_Backup_Test_{}", uuid::Uuid::new_v4()));
        let mgr = PathManager::init_with_mode(temp_dir.clone(), true);

        // Open and migrate a real database
        let db_path = mgr.database_path();
        let conn = Connection::open(&db_path).unwrap();
        db::run_migrations(&conn).unwrap();

        // Write some test data
        conn.execute(
            "INSERT INTO companies (id, name, currency_symbol, currency_code, created_at, updated_at) 
             VALUES ('comp_port', 'Portable Co', '₹', 'INR', '2026-10-12', '2026-10-12')",
            [],
        ).unwrap();

        // Create atomic backup
        let backup_path = mgr.create_backup(&conn).unwrap();
        assert!(std::path::Path::new(&backup_path).exists());

        // Verify that the backup can be opened independently and has our data
        let restore_conn = Connection::open(&backup_path).unwrap();
        let comp_name: String = restore_conn.query_row(
            "SELECT name FROM companies WHERE id = 'comp_port'",
            [],
            |r| r.get(0),
        ).unwrap();
        assert_eq!(comp_name, "Portable Co");

        // Clean up temp test directory
        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
