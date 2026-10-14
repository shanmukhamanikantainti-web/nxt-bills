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
        assert_eq!(portable_mgr.database_path(), temp_usb_dir.join("Data").join("Database").join("nxt_bills.sqlite"));

        // 2. Test Installed Mode
        let app_dir = PathBuf::from("C:\\Program Files\\SDL_ACC");
        let installed_mgr = PathManager::init_with_mode(app_dir.clone(), false);
        assert_eq!(installed_mgr.mode(), &DeploymentMode::Installed);
        // Data directory should be isolated from Program Files
        assert_ne!(installed_mgr.data_directory(), app_dir.join("Data"));

        // 3. Test relative document path resolution and traversal prevention
        let sales_doc = portable_mgr.resolve_document_path("Sales/INV001.pdf").unwrap();
        assert_eq!(sales_doc, temp_usb_dir.join("Data").join("Documents").join("Sales/INV001.pdf"));

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

        assert_eq!(doc_e, drive_e.join("Data").join("Documents").join("Sales/INV001.pdf"));
        assert_eq!(doc_f, drive_f.join("Data").join("Documents").join("Sales/INV001.pdf"));
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

    #[test]
    fn test_legacy_data_import_staging_and_validation() {
        use crate::importer::{LegacyImporter, LegacyImportPayload, LegacyCustomerRow, LegacyProductRow};

        let mut conn = Connection::open_in_memory().unwrap();
        db::run_migrations(&conn).unwrap();

        // Seed company
        conn.execute(
            "INSERT INTO companies (id, name, currency_symbol, currency_code, created_at, updated_at)
             VALUES ('comp_legacy', 'Legacy Test Corp', '₹', 'INR', '2026-10-12', '2026-10-12')",
            [],
        ).unwrap();

        let payload = LegacyImportPayload {
            company_id: "comp_legacy".to_string(),
            customers: vec![
                LegacyCustomerRow {
                    name: "Acme Client".to_string(),
                    code: Some("CUST-001".to_string()),
                    phone: Some("9876543210".to_string()),
                    email: None,
                    address: None,
                    tax_number: None,
                    opening_balance: Some(150000),
                },
                LegacyCustomerRow {
                    name: "".to_string(), // Invalid: empty name
                    code: None,
                    phone: None,
                    email: None,
                    address: None,
                    tax_number: None,
                    opening_balance: None,
                },
            ],
            suppliers: vec![],
            products: vec![
                LegacyProductRow {
                    name: "Steel Rods".to_string(),
                    code: Some("PRD-001".to_string()),
                    purchase_price: Some(5000),
                    selling_price: Some(7500),
                    opening_stock: Some(50.0),
                    tax_rate_bps: Some(1800),
                },
                LegacyProductRow {
                    name: "Broken Negative Item".to_string(),
                    code: Some("PRD-NEG".to_string()),
                    purchase_price: Some(100),
                    selling_price: Some(200),
                    opening_stock: Some(-5.0), // Invalid: negative opening stock
                    tax_rate_bps: Some(0),
                },
            ],
        };

        let summary = LegacyImporter::import_legacy_data(&mut conn, payload).unwrap();
        assert_eq!(summary.customers_imported, 1);
        assert_eq!(summary.products_imported, 1);
        assert_eq!(summary.rejected_count, 2); // 1 empty customer name, 1 negative product stock

        // Verify that valid records became native SDL ACC entities
        let cust_count: i64 = conn.query_row("SELECT COUNT(*) FROM customers WHERE company_id = 'comp_legacy'", [], |r| r.get(0)).unwrap();
        assert_eq!(cust_count, 1);

        let prod_stock: f64 = conn.query_row("SELECT current_stock FROM products WHERE code = 'PRD-001'", [], |r| r.get(0)).unwrap();
        assert_eq!(prod_stock, 50.0);
    }

    #[test]
    fn test_package_export_and_import_roundtrip() {
        use crate::storage::PathManager;
        use crate::transfer::TransferService;

        let comp_a_dir = std::env::temp_dir().join(format!("SDL_ACC_CompA_{}", uuid::Uuid::new_v4()));
        let usb_dir = std::env::temp_dir().join(format!("SDL_ACC_USB_{}", uuid::Uuid::new_v4()));
        let comp_b_dir = std::env::temp_dir().join(format!("SDL_ACC_CompB_{}", uuid::Uuid::new_v4()));

        let mgr_a = PathManager::init_with_mode(comp_a_dir.clone(), true);
        let mut conn_a = Connection::open(&mgr_a.database_path()).unwrap();
        db::run_migrations(&conn_a).unwrap();

        // Update seeded company name on Computer A to test transfer
        conn_a.execute(
            "UPDATE companies SET name = 'Transferable Corp' WHERE id = 'comp-blackpeak-001'",
            [],
        ).unwrap();

        // 1. Export package to USB simulation directory
        let export_res = TransferService::export_package(&conn_a, &mgr_a, &usb_dir).unwrap();
        assert!(export_res.success);

        // 2. Validate package on USB
        let validation = TransferService::validate_package(&usb_dir);
        assert!(validation.is_valid);
        assert_eq!(validation.manifest.unwrap().company_name.unwrap(), "Transferable Corp");

        // 3. Import package onto Computer B
        let mgr_b = PathManager::init_with_mode(comp_b_dir.clone(), true);
        let mut conn_b = Connection::open(&mgr_b.database_path()).unwrap();

        let import_res = TransferService::import_package(&mut conn_b, &mgr_b, &usb_dir).unwrap();
        assert!(import_res.success);

        // 4. Verify Computer B now contains identical accounting records
        let verified_conn = Connection::open(&mgr_b.database_path()).unwrap();
        let comp_b_name: String = verified_conn.query_row(
            "SELECT name FROM companies WHERE id = 'comp-blackpeak-001'",
            [],
            |r| r.get(0),
        ).unwrap();
        assert_eq!(comp_b_name, "Transferable Corp");

        // Clean up temp directories
        let _ = std::fs::remove_dir_all(&comp_a_dir);
        let _ = std::fs::remove_dir_all(&usb_dir);
        let _ = std::fs::remove_dir_all(&comp_b_dir);
    }

    #[test]
    fn test_sales_invoice_posting_foreign_key_integrity() {
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        db::run_migrations(&conn).unwrap();

        // 1. Create company
        conn.execute(
            "INSERT INTO companies (id, name, currency_symbol, currency_code, created_at, updated_at) 
             VALUES ('comp_fk', 'FK Test Company', '₹', 'INR', '2026-10-13', '2026-10-13')",
            [],
        ).unwrap();
        accounting::seed_company_defaults(&conn, "comp_fk").unwrap();

        // 2. Create customer with sub-ledger
        conn.execute(
            "INSERT INTO ledger_accounts (id, company_id, code, name, account_type, is_system, opening_balance, current_balance, created_at)
             VALUES ('cust_ledger_1', 'comp_fk', 'CUST-001', 'Test Customer', 'Asset', 0, 0, 0, '2026-10-13')",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO customers (id, company_id, ledger_account_id, name, code, is_active, created_at)
             VALUES ('cust_1', 'comp_fk', 'cust_ledger_1', 'Test Customer', 'C01', 1, '2026-10-13')",
            [],
        ).unwrap();

        // 3. Create product with stock
        conn.execute(
            "INSERT INTO products (id, company_id, name, code, purchase_price, selling_price, current_stock, reorder_level, is_active, created_at)
             VALUES ('prod_1', 'comp_fk', 'Test Product', 'P01', 5000, 7500, 50.0, 5.0, 1, '2026-10-13')",
            [],
        ).unwrap();

        // 4. Execute post_sale transaction with header inserted before items
        let tx = conn.transaction().unwrap();
        let sale_id = uuid::Uuid::new_v4().to_string();

        // Insert header first
        tx.execute(
            "INSERT INTO sales (id, company_id, invoice_number, invoice_date, customer_id, payment_mode, subtotal, discount_total, tax_total, grand_total, status, created_at)
             VALUES (?1, 'comp_fk', 'INV-00001', '2026-10-13', 'cust_1', 'Credit', 7500, 0, 1350, 8850, 'POSTED', '2026-10-13')",
            rusqlite::params![sale_id],
        ).unwrap();

        // Insert line item (foreign key must succeed because header is present)
        let line_id = uuid::Uuid::new_v4().to_string();
        tx.execute(
            "INSERT INTO sales_items (id, sale_id, product_id, quantity, rate, discount, tax_rate_bps, tax_amount, total_amount)
             VALUES (?1, ?2, 'prod_1', 1.0, 7500, 0, 1800, 1350, 8850)",
            rusqlite::params![line_id, sale_id],
        ).unwrap();

        // Record stock movement
        inventory::record_stock_movement(
            &tx, "comp_fk", "prod_1", "SALE", "SALES_INVOICE", &sale_id, "2026-10-13", 0.0, 1.0, 7500, None
        ).unwrap();

        tx.commit().unwrap();

        // Verify stock decreased from 50 to 49
        let remaining_stock: f64 = conn.query_row(
            "SELECT current_stock FROM products WHERE id = 'prod_1'", [], |r| r.get(0)
        ).unwrap();
        assert_eq!(remaining_stock, 49.0);

        // Verify sales record exists
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM sales_items WHERE sale_id = ?1", rusqlite::params![sale_id], |r| r.get(0)).unwrap();
        assert_eq!(count, 1);
    }
}
