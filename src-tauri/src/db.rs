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

    Ok(())
}
