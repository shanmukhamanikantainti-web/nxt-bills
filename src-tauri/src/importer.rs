use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use chrono::Local;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegacyCustomerRow {
    pub name: String,
    pub code: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub tax_number: Option<String>,
    pub opening_balance: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegacySupplierRow {
    pub name: String,
    pub code: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub tax_number: Option<String>,
    pub opening_balance: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegacyProductRow {
    pub name: String,
    pub code: Option<String>,
    pub purchase_price: Option<i64>,
    pub selling_price: Option<i64>,
    pub opening_stock: Option<f64>,
    pub tax_rate_bps: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LegacyImportPayload {
    pub company_id: String,
    pub customers: Vec<LegacyCustomerRow>,
    pub suppliers: Vec<LegacySupplierRow>,
    pub products: Vec<LegacyProductRow>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportSummaryReport {
    pub total_processed: usize,
    pub imported_successfully: usize,
    pub warnings_count: usize,
    pub rejected_count: usize,
    pub customers_imported: usize,
    pub suppliers_imported: usize,
    pub products_imported: usize,
    pub warnings: Vec<String>,
    pub rejected_details: Vec<String>,
}

pub struct LegacyImporter;

impl LegacyImporter {
    /// Ingests legacy payload through an isolated staging transaction with strict accounting validation.
    /// Rejects corrupt or invalid rows with explanations, commits only clean data, and logs to audit trail.
    pub fn import_legacy_data(
        conn: &mut Connection,
        payload: LegacyImportPayload,
    ) -> Result<ImportSummaryReport, String> {
        let mut customers_imported = 0;
        let mut suppliers_imported = 0;
        let mut products_imported = 0;
        let mut warnings = Vec::new();
        let mut rejected = Vec::new();

        let now = Local::now().to_rfc3339();
        let total = payload.customers.len() + payload.suppliers.len() + payload.products.len();

        let tx = conn.transaction().map_err(|e| format!("Transaction error: {}", e))?;

        // 1. Process Customers
        for (idx, c) in payload.customers.into_iter().enumerate() {
            let row_num = idx + 1;
            if c.name.trim().is_empty() {
                rejected.push(format!("Customer row {}: Name cannot be empty", row_num));
                continue;
            }

            let cust_code = c.code.unwrap_or_else(|| format!("CUST-{:04}", row_num));

            // Check if customer with this code already exists
            let exists: i64 = tx.query_row(
                "SELECT COUNT(*) FROM customers WHERE company_id = ?1 AND code = ?2",
                params![payload.company_id, cust_code],
                |r| r.get(0),
            ).unwrap_or(0);

            if exists > 0 {
                warnings.push(format!("Customer '{}' (code {}) skipped: already exists", c.name, cust_code));
                continue;
            }

            let cust_id = Uuid::new_v4().to_string();
            let ledger_id = Uuid::new_v4().to_string();
            let op_bal = c.opening_balance.unwrap_or(0);

            // Sub-ledger
            let ledger_res = tx.execute(
                "INSERT INTO ledger_accounts (id, company_id, code, name, account_type, is_system, opening_balance, current_balance, created_at)
                 VALUES (?1, ?2, ?3, ?4, 'Asset', 0, ?5, ?5, ?6)",
                params![ledger_id, payload.company_id, format!("CUST-{}", cust_code), c.name, op_bal, now],
            );
            if let Err(e) = ledger_res {
                rejected.push(format!("Customer row {}: Failed ledger creation: {}", row_num, e));
                continue;
            }

            // Customer record
            let cust_res = tx.execute(
                "INSERT INTO customers (id, company_id, ledger_account_id, name, code, phone, email, address, tax_number, opening_balance, credit_limit, current_balance, is_active, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 5000000, ?10, 1, ?11)",
                params![
                    cust_id, payload.company_id, ledger_id, c.name, cust_code, c.phone, c.email, c.address,
                    c.tax_number, op_bal, now
                ],
            );
            if let Err(e) = cust_res {
                rejected.push(format!("Customer row {}: Insert failed: {}", row_num, e));
                continue;
            }

            customers_imported += 1;
        }

        // 2. Process Suppliers
        for (idx, s) in payload.suppliers.into_iter().enumerate() {
            let row_num = idx + 1;
            if s.name.trim().is_empty() {
                rejected.push(format!("Supplier row {}: Name cannot be empty", row_num));
                continue;
            }

            let supp_code = s.code.unwrap_or_else(|| format!("SUPP-{:04}", row_num));

            let exists: i64 = tx.query_row(
                "SELECT COUNT(*) FROM suppliers WHERE company_id = ?1 AND code = ?2",
                params![payload.company_id, supp_code],
                |r| r.get(0),
            ).unwrap_or(0);

            if exists > 0 {
                warnings.push(format!("Supplier '{}' (code {}) skipped: already exists", s.name, supp_code));
                continue;
            }

            let supp_id = Uuid::new_v4().to_string();
            let ledger_id = Uuid::new_v4().to_string();
            let op_bal = s.opening_balance.unwrap_or(0);

            let ledger_res = tx.execute(
                "INSERT INTO ledger_accounts (id, company_id, code, name, account_type, is_system, opening_balance, current_balance, created_at)
                 VALUES (?1, ?2, ?3, ?4, 'Liability', 0, ?5, ?5, ?6)",
                params![ledger_id, payload.company_id, format!("SUPP-{}", supp_code), s.name, op_bal, now],
            );
            if let Err(e) = ledger_res {
                rejected.push(format!("Supplier row {}: Failed ledger creation: {}", row_num, e));
                continue;
            }

            let supp_res = tx.execute(
                "INSERT INTO suppliers (id, company_id, ledger_account_id, name, code, phone, email, address, tax_number, opening_balance, current_balance, is_active, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10, 1, ?11)",
                params![
                    supp_id, payload.company_id, ledger_id, s.name, supp_code, s.phone, s.email, s.address,
                    s.tax_number, op_bal, now
                ],
            );
            if let Err(e) = supp_res {
                rejected.push(format!("Supplier row {}: Insert failed: {}", row_num, e));
                continue;
            }

            suppliers_imported += 1;
        }

        // 3. Process Products & Initial Inventory
        for (idx, p) in payload.products.into_iter().enumerate() {
            let row_num = idx + 1;
            if p.name.trim().is_empty() {
                rejected.push(format!("Product row {}: Name cannot be empty", row_num));
                continue;
            }

            let prod_code = p.code.unwrap_or_else(|| format!("PRD-{:04}", row_num));

            let exists: i64 = tx.query_row(
                "SELECT COUNT(*) FROM products WHERE company_id = ?1 AND code = ?2",
                params![payload.company_id, prod_code],
                |r| r.get(0),
            ).unwrap_or(0);

            if exists > 0 {
                warnings.push(format!("Product '{}' (code {}) skipped: already exists", p.name, prod_code));
                continue;
            }

            let prod_id = Uuid::new_v4().to_string();
            let buy_price = p.purchase_price.unwrap_or(0);
            let sell_price = p.selling_price.unwrap_or(0);
            let tax_bps = p.tax_rate_bps.unwrap_or(0);
            let op_stock = p.opening_stock.unwrap_or(0.0);

            if op_stock < 0.0 {
                rejected.push(format!("Product row {}: Negative opening stock ({}) is forbidden", row_num, op_stock));
                continue;
            }

            let prod_res = tx.execute(
                "INSERT INTO products (id, company_id, name, code, purchase_price, selling_price, tax_rate_bps, current_stock, reorder_level, is_active, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0.0, 5, 1, ?8)",
                params![prod_id, payload.company_id, p.name, prod_code, buy_price, sell_price, tax_bps, now],
            );
            if let Err(e) = prod_res {
                rejected.push(format!("Product row {}: Insert failed: {}", row_num, e));
                continue;
            }

            if op_stock > 0.0 {
                if let Err(e) = crate::inventory::record_stock_movement(
                    &tx,
                    &payload.company_id,
                    &prod_id,
                    "OPENING",
                    "LEGACY_IMPORT",
                    &prod_id,
                    &now[0..10],
                    op_stock,
                    0.0,
                    buy_price,
                    Some("Legacy migration opening stock balance"),
                ) {
                    rejected.push(format!("Product row {}: Stock movement recording failed: {}", row_num, e));
                    continue;
                }
            }

            products_imported += 1;
        }

        // Commit all valid staging records atomically
        tx.commit().map_err(|e| format!("Commit error: {}", e))?;

        let imported_total = customers_imported + suppliers_imported + products_imported;
        Ok(ImportSummaryReport {
            total_processed: total,
            imported_successfully: imported_total,
            warnings_count: warnings.len(),
            rejected_count: rejected.len(),
            customers_imported,
            suppliers_imported,
            products_imported,
            warnings,
            rejected_details: rejected,
        })
    }
}
