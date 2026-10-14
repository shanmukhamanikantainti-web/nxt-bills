use rusqlite::{Connection, Result};

pub fn run_migrations(conn: &Connection) -> Result<()> {
    // Enable WAL mode, Foreign Keys, and Normal synchronous for maximum crash resilience and performance
    conn.execute_batch("
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        PRAGMA synchronous = NORMAL;
        PRAGMA busy_timeout = 5000;
    ")?;

    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        );
    ")?;

    let current_version: i64 = conn.query_row(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
        [],
        |row| row.get(0),
    )?;

    if current_version < 1 {
        conn.execute_batch("
            -- Companies Table
            CREATE TABLE IF NOT EXISTS companies (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                trade_name TEXT,
                tax_number TEXT,
                address_line1 TEXT,
                address_line2 TEXT,
                city TEXT,
                state TEXT,
                postal_code TEXT,
                phone TEXT,
                email TEXT,
                currency_symbol TEXT NOT NULL DEFAULT '₹',
                currency_code TEXT NOT NULL DEFAULT 'INR',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            -- Financial Years
            CREATE TABLE IF NOT EXISTS financial_years (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                code TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                is_closed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                UNIQUE(company_id, code)
            );

            -- Ledger Accounts (Standard double-entry chart of accounts)
            CREATE TABLE IF NOT EXISTS ledger_accounts (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                code TEXT NOT NULL,
                name TEXT NOT NULL,
                account_type TEXT NOT NULL CHECK(account_type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
                parent_id TEXT REFERENCES ledger_accounts(id),
                is_system INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                opening_balance INTEGER NOT NULL DEFAULT 0,
                current_balance INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                UNIQUE(company_id, code)
            );

            -- Customers
            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                ledger_account_id TEXT NOT NULL REFERENCES ledger_accounts(id),
                name TEXT NOT NULL,
                code TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                address TEXT,
                tax_number TEXT,
                opening_balance INTEGER NOT NULL DEFAULT 0,
                credit_limit INTEGER NOT NULL DEFAULT 0,
                current_balance INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                notes TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(company_id, code)
            );

            -- Suppliers
            CREATE TABLE IF NOT EXISTS suppliers (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                ledger_account_id TEXT NOT NULL REFERENCES ledger_accounts(id),
                name TEXT NOT NULL,
                code TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                address TEXT,
                tax_number TEXT,
                opening_balance INTEGER NOT NULL DEFAULT 0,
                current_balance INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 1,
                notes TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(company_id, code)
            );

            -- Product Categories
            CREATE TABLE IF NOT EXISTS product_categories (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                code TEXT,
                UNIQUE(company_id, name)
            );

            -- Measurement Units
            CREATE TABLE IF NOT EXISTS units (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                code TEXT NOT NULL,
                name TEXT NOT NULL,
                UNIQUE(company_id, code)
            );

            -- Products & Inventory Items
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                category_id TEXT REFERENCES product_categories(id),
                unit_id TEXT REFERENCES units(id),
                name TEXT NOT NULL,
                code TEXT NOT NULL,
                sku TEXT,
                hsn_code TEXT,
                purchase_price INTEGER NOT NULL DEFAULT 0,
                selling_price INTEGER NOT NULL DEFAULT 0,
                tax_rate_bps INTEGER NOT NULL DEFAULT 0,
                current_stock REAL NOT NULL DEFAULT 0.0,
                reorder_level REAL NOT NULL DEFAULT 0.0,
                is_active INTEGER NOT NULL DEFAULT 1,
                notes TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(company_id, code)
            );

            -- Journal Entries (Header for all double-entry financial transactions)
            CREATE TABLE IF NOT EXISTS journal_entries (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                financial_year_id TEXT REFERENCES financial_years(id),
                voucher_type TEXT NOT NULL CHECK(voucher_type IN ('Sales', 'Purchase', 'Payment', 'Receipt', 'DebitNote', 'CreditNote', 'Journal', 'OpeningBalance')),
                voucher_number TEXT NOT NULL,
                entry_date TEXT NOT NULL,
                narration TEXT,
                reference_id TEXT,
                is_posted INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                UNIQUE(company_id, voucher_type, voucher_number)
            );

            -- Journal Lines (Debits and Credits)
            CREATE TABLE IF NOT EXISTS journal_lines (
                id TEXT PRIMARY KEY,
                journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
                ledger_account_id TEXT NOT NULL REFERENCES ledger_accounts(id),
                debit INTEGER NOT NULL DEFAULT 0,
                credit INTEGER NOT NULL DEFAULT 0,
                description TEXT,
                line_order INTEGER NOT NULL
            );

            -- Stock Transactions (Authoritative Inventory Source of Truth)
            CREATE TABLE IF NOT EXISTS stock_transactions (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                product_id TEXT NOT NULL REFERENCES products(id),
                transaction_type TEXT NOT NULL CHECK(transaction_type IN ('OPENING', 'PURCHASE', 'SALE', 'DEBIT_NOTE', 'CREDIT_NOTE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT')),
                reference_type TEXT NOT NULL,
                reference_id TEXT NOT NULL,
                transaction_date TEXT NOT NULL,
                quantity_in REAL NOT NULL DEFAULT 0.0,
                quantity_out REAL NOT NULL DEFAULT 0.0,
                unit_rate INTEGER NOT NULL DEFAULT 0,
                balance_after REAL NOT NULL,
                notes TEXT,
                created_at TEXT NOT NULL
            );

            -- Sales Invoices
            CREATE TABLE IF NOT EXISTS sales (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                financial_year_id TEXT REFERENCES financial_years(id),
                invoice_number TEXT NOT NULL,
                invoice_date TEXT NOT NULL,
                customer_id TEXT REFERENCES customers(id),
                payment_mode TEXT NOT NULL DEFAULT 'Credit', -- Cash, Bank, Credit
                subtotal INTEGER NOT NULL DEFAULT 0,
                discount_total INTEGER NOT NULL DEFAULT 0,
                tax_total INTEGER NOT NULL DEFAULT 0,
                grand_total INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'POSTED', -- DRAFT, POSTED, CANCELLED
                notes TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(company_id, invoice_number)
            );

            CREATE TABLE IF NOT EXISTS sales_items (
                id TEXT PRIMARY KEY,
                sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
                product_id TEXT NOT NULL REFERENCES products(id),
                quantity REAL NOT NULL,
                rate INTEGER NOT NULL,
                discount INTEGER NOT NULL DEFAULT 0,
                tax_rate_bps INTEGER NOT NULL DEFAULT 0,
                tax_amount INTEGER NOT NULL DEFAULT 0,
                total_amount INTEGER NOT NULL
            );

            -- Purchases
            CREATE TABLE IF NOT EXISTS purchases (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                financial_year_id TEXT REFERENCES financial_years(id),
                purchase_number TEXT NOT NULL,
                purchase_date TEXT NOT NULL,
                supplier_id TEXT REFERENCES suppliers(id),
                payment_mode TEXT NOT NULL DEFAULT 'Credit',
                subtotal INTEGER NOT NULL DEFAULT 0,
                discount_total INTEGER NOT NULL DEFAULT 0,
                tax_total INTEGER NOT NULL DEFAULT 0,
                grand_total INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'POSTED',
                notes TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(company_id, purchase_number)
            );

            CREATE TABLE IF NOT EXISTS purchase_items (
                id TEXT PRIMARY KEY,
                purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
                product_id TEXT NOT NULL REFERENCES products(id),
                quantity REAL NOT NULL,
                rate INTEGER NOT NULL,
                discount INTEGER NOT NULL DEFAULT 0,
                tax_rate_bps INTEGER NOT NULL DEFAULT 0,
                tax_amount INTEGER NOT NULL DEFAULT 0,
                total_amount INTEGER NOT NULL
            );

            -- Debit Notes (Supplier Returns / Price Reductions)
            CREATE TABLE IF NOT EXISTS debit_notes (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                note_number TEXT NOT NULL,
                note_date TEXT NOT NULL,
                supplier_id TEXT NOT NULL REFERENCES suppliers(id),
                reference_invoice TEXT,
                amount INTEGER NOT NULL,
                tax_amount INTEGER NOT NULL DEFAULT 0,
                total_amount INTEGER NOT NULL,
                reason TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'POSTED',
                created_at TEXT NOT NULL,
                UNIQUE(company_id, note_number)
            );

            CREATE TABLE IF NOT EXISTS debit_note_items (
                id TEXT PRIMARY KEY,
                debit_note_id TEXT NOT NULL REFERENCES debit_notes(id) ON DELETE CASCADE,
                product_id TEXT REFERENCES products(id),
                quantity REAL NOT NULL DEFAULT 0.0,
                rate INTEGER NOT NULL,
                tax_rate_bps INTEGER NOT NULL DEFAULT 0,
                amount INTEGER NOT NULL
            );

            -- Credit Notes (Customer Returns / Credits)
            CREATE TABLE IF NOT EXISTS credit_notes (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                note_number TEXT NOT NULL,
                note_date TEXT NOT NULL,
                customer_id TEXT NOT NULL REFERENCES customers(id),
                reference_invoice TEXT,
                amount INTEGER NOT NULL,
                tax_amount INTEGER NOT NULL DEFAULT 0,
                total_amount INTEGER NOT NULL,
                reason TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'POSTED',
                created_at TEXT NOT NULL,
                UNIQUE(company_id, note_number)
            );

            CREATE TABLE IF NOT EXISTS credit_note_items (
                id TEXT PRIMARY KEY,
                credit_note_id TEXT NOT NULL REFERENCES credit_notes(id) ON DELETE CASCADE,
                product_id TEXT REFERENCES products(id),
                quantity REAL NOT NULL DEFAULT 0.0,
                rate INTEGER NOT NULL,
                tax_rate_bps INTEGER NOT NULL DEFAULT 0,
                amount INTEGER NOT NULL
            );

            -- Payments & Receipts
            CREATE TABLE IF NOT EXISTS payments_receipts (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                voucher_type TEXT NOT NULL CHECK(voucher_type IN ('PAYMENT', 'RECEIPT')),
                voucher_number TEXT NOT NULL,
                transaction_date TEXT NOT NULL,
                party_type TEXT NOT NULL, -- Customer, Supplier, Direct
                party_id TEXT,
                ledger_account_id TEXT NOT NULL REFERENCES ledger_accounts(id),
                payment_account_id TEXT NOT NULL REFERENCES ledger_accounts(id),
                amount INTEGER NOT NULL,
                reference_number TEXT,
                notes TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(company_id, voucher_type, voucher_number)
            );

            -- Audit Trail
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                company_id TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT NOT NULL,
                action TEXT NOT NULL, -- INSERT, UPDATE, CANCEL, BACKUP, RESTORE
                details TEXT,
                timestamp TEXT NOT NULL
            );

            -- Application Settings
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            -- Indexes for fast query and reporting
            CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines(ledger_account_id);
            CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(company_id, entry_date);
            CREATE INDEX IF NOT EXISTS idx_stock_tx_product_date ON stock_transactions(product_id, transaction_date);
            CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(company_id, invoice_date);
            CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(company_id, purchase_date);
            CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
            CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
            CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);

            INSERT INTO schema_migrations (version, applied_at) VALUES (1, datetime('now'));
        ")?;
    }

    if current_version < 2 {
        conn.execute_batch("
            -- User Roles
            CREATE TABLE IF NOT EXISTS roles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                description TEXT
            );

            INSERT OR IGNORE INTO roles (id, name, description) VALUES
                ('ADMIN', 'Administrator', 'Full system access, user management, backups, and audits'),
                ('MANAGER', 'Manager', 'Financial reports, invoice management, product & customer control'),
                ('ACCOUNTANT', 'Accountant', 'Vouchers, ledger reconciliations, double-entry journals'),
                ('BILLING_OPERATOR', 'Billing Operator', 'Sales invoice voucher entry and printing'),
                ('VIEWER', 'Viewer', 'Read-only access to vouchers and stock reports');

            -- Users Table
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL UNIQUE,
                display_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                role_id TEXT NOT NULL REFERENCES roles(id),
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                last_login_at TEXT
            );

            -- Enhanced Audit Logs
            CREATE TABLE IF NOT EXISTS audit_logs_v2 (
                id TEXT PRIMARY KEY,
                user_id TEXT REFERENCES users(id),
                username_snapshot TEXT NOT NULL,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT,
                description TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                metadata TEXT
            );

            -- Migrate old audit_logs if existing
            INSERT INTO audit_logs_v2 (id, user_id, username_snapshot, action, entity_type, entity_id, description, timestamp, metadata)
            SELECT id, NULL, 'SYSTEM', action, entity_type, entity_id, details, timestamp, NULL FROM audit_logs;

            DROP TABLE audit_logs;
            ALTER TABLE audit_logs_v2 RENAME TO audit_logs;

            -- Invoice Print Audit Table
            CREATE TABLE IF NOT EXISTS invoice_print_audit (
                id TEXT PRIMARY KEY,
                invoice_id TEXT NOT NULL,
                invoice_number TEXT NOT NULL,
                user_id TEXT REFERENCES users(id),
                username_snapshot TEXT NOT NULL,
                printed_at TEXT NOT NULL,
                print_type TEXT NOT NULL CHECK(print_type IN ('PRINT', 'PDF', 'PREVIEW')),
                printer_name TEXT,
                document_type TEXT NOT NULL DEFAULT 'TAX_INVOICE',
                status TEXT NOT NULL DEFAULT 'COMPLETED'
            );

            CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
            CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
            CREATE INDEX IF NOT EXISTS idx_invoice_print_audit_time ON invoice_print_audit(printed_at);
            CREATE INDEX IF NOT EXISTS idx_invoice_print_audit_invoice ON invoice_print_audit(invoice_number);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

            INSERT INTO schema_migrations (version, applied_at) VALUES (2, datetime('now'));
        ")?;

        // Seed default Administrator account if no users exist
        // Password hash for 'admin123' using SHA-256
        let user_count: i64 = conn.query_row("SELECT COUNT(*) FROM users", [], |r| r.get(0)).unwrap_or(0);
        if user_count == 0 {
            use sha2::{Sha256, Digest};
            let mut hasher = Sha256::new();
            hasher.update(b"admin123");
            let hash = hex::encode(hasher.finalize());
            let now = chrono::Local::now().to_rfc3339();

            conn.execute(
                "INSERT INTO users (id, username, display_name, password_hash, role_id, is_active, created_at, updated_at)
                 VALUES ('usr-admin', 'admin', 'System Administrator', ?1, 'ADMIN', 1, ?2, ?2)",
                rusqlite::params![hash, now],
            )?;

            // Record initial audit entry
            conn.execute(
                "INSERT INTO audit_logs (id, user_id, username_snapshot, action, entity_type, entity_id, description, timestamp)
                 VALUES ('audit-init', 'usr-admin', 'admin', 'SYSTEM_INIT', 'SYSTEM', 'SYSTEM', 'Initial Administrator account initialized', ?1)",
                rusqlite::params![now],
            )?;
        }

        // Seed default company profile for BLACK PEAK STUDIO if no company exists
        let comp_count: i64 = conn.query_row("SELECT COUNT(*) FROM companies", [], |r| r.get(0)).unwrap_or(0);
        if comp_count == 0 {
            let now = chrono::Local::now().to_rfc3339();
            conn.execute(
                "INSERT INTO companies (
                    id, name, trade_name, currency_symbol, currency_code,
                    address_line1, address_line2, city, state, postal_code,
                    phone, email, tax_number, created_at, updated_at
                ) VALUES (
                    'comp-blackpeak-001', 'BLACK PEAK STUDIO', 'BLACK PEAK STUDIO', '₹', 'INR',
                    '', '', '', '', '',
                    '', '', '', ?1, ?1
                )",
                rusqlite::params![now],
            )?;

            // Seed financial year
            conn.execute(
                "INSERT INTO financial_years (id, company_id, code, start_date, end_date, is_closed, created_at)
                 VALUES ('fy-2026-27', 'comp-blackpeak-001', '2026-27', '2026-04-01', '2027-03-31', 0, ?1)",
                rusqlite::params![now],
            )?;

            // Seed primary chart of accounts
            let default_accounts = [
                ("acc-cash", "Cash on Hand", "Asset", 1),
                ("acc-bank", "Bank Account", "Asset", 1),
                ("acc-debtors", "Sundry Debtors (Customers)", "Asset", 1),
                ("acc-creditors", "Sundry Creditors (Suppliers)", "Liability", 1),
                ("acc-sales", "Sales Account", "Revenue", 1),
                ("acc-purchases", "Purchase Account", "Expense", 1),
                ("acc-cgst-out", "Output CGST", "Liability", 1),
                ("acc-sgst-out", "Output SGST", "Liability", 1),
                ("acc-igst-out", "Output IGST", "Liability", 1),
                ("acc-cgst-in", "Input CGST", "Asset", 1),
                ("acc-sgst-in", "Input SGST", "Asset", 1),
                ("acc-igst-in", "Input IGST", "Asset", 1),
                ("acc-roundoff", "Round Off Account", "Expense", 1),
            ];

            for (acc_id, acc_name, acc_type, is_sys) in default_accounts {
                let code = format!("A-{}", &acc_id[4..]);
                conn.execute(
                    "INSERT INTO ledger_accounts (id, company_id, code, name, account_type, is_system, opening_balance, current_balance, created_at)
                     VALUES (?1, 'comp-blackpeak-001', ?2, ?3, ?4, ?5, 0, 0, ?6)",
                    rusqlite::params![acc_id, code, acc_name, acc_type, is_sys, now],
                )?;
            }
        }
    }

    Ok(())
}

