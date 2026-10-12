use std::sync::Mutex;
use rusqlite::{params, Connection};
use tauri::State;
use uuid::Uuid;
use chrono::Local;
use crate::models::*;
use crate::storage::{StorageInfo, PathManager};
use crate::accounting;
use crate::inventory;

pub struct AppState {
    pub db: Mutex<Connection>,
    pub storage: Mutex<PathManager>,
}

#[tauri::command]
pub fn get_storage_status(state: State<'_, AppState>) -> Result<StorageInfo, String> {
    let mgr = state.storage.lock().map_err(|e| e.to_string())?;
    Ok(mgr.get_storage_info())
}

#[tauri::command]
pub fn backup_database(state: State<'_, AppState>) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mgr = state.storage.lock().map_err(|e| e.to_string())?;
    mgr.create_backup(&conn)
}

#[tauri::command]
pub fn safe_eject(state: State<'_, AppState>) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mgr = state.storage.lock().map_err(|e| e.to_string())?;
    mgr.safe_eject(&conn)?;
    Ok("Storage flushed and ready for safe removal".to_string())
}

#[tauri::command]
pub fn resolve_document_path(state: State<'_, AppState>, relative_path: String) -> Result<String, String> {
    let mgr = state.storage.lock().map_err(|e| e.to_string())?;
    let full_path = mgr.resolve_document_path(&relative_path)?;
    Ok(full_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn export_transfer_package(
    state: State<'_, AppState>,
    target_dir: String,
) -> Result<crate::transfer::ExportPackageResult, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mgr = state.storage.lock().map_err(|e| e.to_string())?;
    let target_path = std::path::PathBuf::from(target_dir);
    crate::transfer::TransferService::export_package(&conn, &mgr, &target_path)
}

#[tauri::command]
pub fn validate_transfer_package(package_dir: String) -> Result<crate::transfer::ValidationResult, String> {
    let target_path = std::path::PathBuf::from(package_dir);
    Ok(crate::transfer::TransferService::validate_package(&target_path))
}

#[tauri::command]
pub fn import_transfer_package(
    state: State<'_, AppState>,
    package_dir: String,
) -> Result<crate::transfer::ImportPackageResult, String> {
    let mut conn = state.db.lock().map_err(|e| e.to_string())?;
    let mgr = state.storage.lock().map_err(|e| e.to_string())?;
    let target_path = std::path::PathBuf::from(package_dir);
    crate::transfer::TransferService::import_package(&mut conn, &mgr, &target_path)
}

#[tauri::command]
pub fn import_legacy_data(
    state: State<'_, AppState>,
    payload: crate::importer::LegacyImportPayload,
) -> Result<crate::importer::ImportSummaryReport, String> {
    let mut conn = state.db.lock().map_err(|e| e.to_string())?;
    crate::importer::LegacyImporter::import_legacy_data(&mut conn, payload)
}

#[tauri::command]
pub fn get_company(state: State<'_, AppState>) -> Result<Option<Company>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, name, trade_name, tax_number, address_line1, address_line2, city, state, postal_code, phone, email, currency_symbol, currency_code, created_at, updated_at 
         FROM companies LIMIT 1"
    ).map_err(|e| e.to_string())?;

    let company = stmt.query_row([], |row| {
        Ok(Company {
            id: row.get(0)?,
            name: row.get(1)?,
            trade_name: row.get(2)?,
            tax_number: row.get(3)?,
            address_line1: row.get(4)?,
            address_line2: row.get(5)?,
            city: row.get(6)?,
            state: row.get(7)?,
            postal_code: row.get(8)?,
            phone: row.get(9)?,
            email: row.get(10)?,
            currency_symbol: row.get(11)?,
            currency_code: row.get(12)?,
            created_at: row.get(13)?,
            updated_at: row.get(14)?,
        })
    }).ok();

    Ok(company)
}

#[tauri::command]
pub fn save_company(state: State<'_, AppState>, company: Company) -> Result<Company, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Local::now().to_rfc3339();
    let comp_id = if company.id.is_empty() {
        Uuid::new_v4().to_string()
    } else {
        company.id.clone()
    };

    conn.execute(
        "INSERT INTO companies (id, name, trade_name, tax_number, address_line1, address_line2, city, state, postal_code, phone, email, currency_symbol, currency_code, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
         ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            trade_name = excluded.trade_name,
            tax_number = excluded.tax_number,
            address_line1 = excluded.address_line1,
            address_line2 = excluded.address_line2,
            city = excluded.city,
            state = excluded.state,
            postal_code = excluded.postal_code,
            phone = excluded.phone,
            email = excluded.email,
            currency_symbol = excluded.currency_symbol,
            currency_code = excluded.currency_code,
            updated_at = excluded.updated_at",
        params![
            comp_id,
            company.name,
            company.trade_name,
            company.tax_number,
            company.address_line1,
            company.address_line2,
            company.city,
            company.state,
            company.postal_code,
            company.phone,
            company.email,
            company.currency_symbol,
            company.currency_code,
            company.created_at.clone().if_empty(&now),
            now
        ],
    ).map_err(|e| format!("Failed to save company: {}", e))?;

    // Seed default chart of accounts and units if new company
    let _ = accounting::seed_company_defaults(&conn, &comp_id);

    // Ensure financial year exists
    let fy_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM financial_years WHERE company_id = ?1",
        params![comp_id],
        |r| r.get(0),
    ).unwrap_or(0);

    if fy_count == 0 {
        let fy_id = Uuid::new_v4().to_string();
        let _ = conn.execute(
            "INSERT INTO financial_years (id, company_id, code, start_date, end_date, is_closed, created_at)
             VALUES (?1, ?2, 'FY2026-27', '2026-04-01', '2027-03-31', 0, ?3)",
            params![fy_id, comp_id, now],
        );
    }

    Ok(Company {
        id: comp_id,
        updated_at: now,
        ..company
    })
}

#[tauri::command]
pub fn list_customers(state: State<'_, AppState>, company_id: String) -> Result<Vec<Customer>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, company_id, ledger_account_id, name, code, phone, email, address, tax_number, opening_balance, credit_limit, current_balance, is_active, notes, created_at
         FROM customers WHERE company_id = ?1 ORDER BY name ASC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![company_id], |row| {
        Ok(Customer {
            id: row.get(0)?,
            company_id: row.get(1)?,
            ledger_account_id: row.get(2)?,
            name: row.get(3)?,
            code: row.get(4)?,
            phone: row.get(5)?,
            email: row.get(6)?,
            address: row.get(7)?,
            tax_number: row.get(8)?,
            opening_balance: row.get(9)?,
            credit_limit: row.get(10)?,
            current_balance: row.get(11)?,
            is_active: row.get::<_, i32>(12)? != 0,
            notes: row.get(13)?,
            created_at: row.get(14)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn create_customer(state: State<'_, AppState>, customer: Customer) -> Result<Customer, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Local::now().to_rfc3339();
    let cust_id = if customer.id.is_empty() { Uuid::new_v4().to_string() } else { customer.id.clone() };

    // 1. Create sub-ledger for this customer under Accounts Receivable
    let ledger_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO ledger_accounts (id, company_id, code, name, account_type, is_system, opening_balance, current_balance, created_at)
         VALUES (?1, ?2, ?3, ?4, 'Asset', 0, ?5, ?5, ?6)",
        params![ledger_id, customer.company_id, format!("CUST-{}", customer.code), customer.name, customer.opening_balance, now],
    ).map_err(|e| format!("Failed to create customer ledger: {}", e))?;

    // 2. Insert customer master
    conn.execute(
        "INSERT INTO customers (id, company_id, ledger_account_id, name, code, phone, email, address, tax_number, opening_balance, credit_limit, current_balance, is_active, notes, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?10, 1, ?12, ?13)",
        params![
            cust_id, customer.company_id, ledger_id, customer.name, customer.code, customer.phone, customer.email, customer.address,
            customer.tax_number, customer.opening_balance, customer.credit_limit, customer.notes, now
        ],
    ).map_err(|e| format!("Failed to create customer: {}", e))?;

    Ok(Customer {
        id: cust_id,
        ledger_account_id: ledger_id,
        created_at: now,
        ..customer
    })
}

#[tauri::command]
pub fn list_suppliers(state: State<'_, AppState>, company_id: String) -> Result<Vec<Supplier>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, company_id, ledger_account_id, name, code, phone, email, address, tax_number, opening_balance, current_balance, is_active, notes, created_at
         FROM suppliers WHERE company_id = ?1 ORDER BY name ASC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![company_id], |row| {
        Ok(Supplier {
            id: row.get(0)?,
            company_id: row.get(1)?,
            ledger_account_id: row.get(2)?,
            name: row.get(3)?,
            code: row.get(4)?,
            phone: row.get(5)?,
            email: row.get(6)?,
            address: row.get(7)?,
            tax_number: row.get(8)?,
            opening_balance: row.get(9)?,
            current_balance: row.get(10)?,
            is_active: row.get::<_, i32>(11)? != 0,
            notes: row.get(12)?,
            created_at: row.get(13)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn create_supplier(state: State<'_, AppState>, supplier: Supplier) -> Result<Supplier, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Local::now().to_rfc3339();
    let supp_id = if supplier.id.is_empty() { Uuid::new_v4().to_string() } else { supplier.id.clone() };

    // 1. Create sub-ledger for this supplier under Accounts Payable
    let ledger_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO ledger_accounts (id, company_id, code, name, account_type, is_system, opening_balance, current_balance, created_at)
         VALUES (?1, ?2, ?3, ?4, 'Liability', 0, ?5, ?5, ?6)",
        params![ledger_id, supplier.company_id, format!("SUPP-{}", supplier.code), supplier.name, supplier.opening_balance, now],
    ).map_err(|e| format!("Failed to create supplier ledger: {}", e))?;

    // 2. Insert supplier master
    conn.execute(
        "INSERT INTO suppliers (id, company_id, ledger_account_id, name, code, phone, email, address, tax_number, opening_balance, current_balance, is_active, notes, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10, 1, ?11, ?12)",
        params![
            supp_id, supplier.company_id, ledger_id, supplier.name, supplier.code, supplier.phone, supplier.email, supplier.address,
            supplier.tax_number, supplier.opening_balance, supplier.notes, now
        ],
    ).map_err(|e| format!("Failed to create supplier: {}", e))?;

    Ok(Supplier {
        id: supp_id,
        ledger_account_id: ledger_id,
        created_at: now,
        ..supplier
    })
}

#[tauri::command]
pub fn list_products(state: State<'_, AppState>, company_id: String) -> Result<Vec<Product>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, company_id, category_id, unit_id, name, code, sku, hsn_code, purchase_price, selling_price, tax_rate_bps, current_stock, reorder_level, is_active, notes, created_at
         FROM products WHERE company_id = ?1 ORDER BY name ASC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![company_id], |row| {
        Ok(Product {
            id: row.get(0)?,
            company_id: row.get(1)?,
            category_id: row.get(2)?,
            unit_id: row.get(3)?,
            name: row.get(4)?,
            code: row.get(5)?,
            sku: row.get(6)?,
            hsn_code: row.get(7)?,
            purchase_price: row.get(8)?,
            selling_price: row.get(9)?,
            tax_rate_bps: row.get(10)?,
            current_stock: row.get(11)?,
            reorder_level: row.get(12)?,
            is_active: row.get::<_, i32>(13)? != 0,
            notes: row.get(14)?,
            created_at: row.get(15)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        list.push(r.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

#[tauri::command]
pub fn create_product(state: State<'_, AppState>, product: Product, opening_qty: f64) -> Result<Product, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let now = Local::now().to_rfc3339();
    let prod_id = if product.id.is_empty() { Uuid::new_v4().to_string() } else { product.id.clone() };

    conn.execute(
        "INSERT INTO products (id, company_id, category_id, unit_id, name, code, sku, hsn_code, purchase_price, selling_price, tax_rate_bps, current_stock, reorder_level, is_active, notes, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, 0.0, ?12, 1, ?13, ?14)",
        params![
            prod_id, product.company_id, product.category_id, product.unit_id, product.name, product.code, product.sku, product.hsn_code,
            product.purchase_price, product.selling_price, product.tax_rate_bps, product.reorder_level, product.notes, now
        ],
    ).map_err(|e| format!("Failed to create product: {}", e))?;

    // If opening stock provided, record opening stock transaction
    if opening_qty > 0.0 {
        inventory::record_stock_movement(
            &conn,
            &product.company_id,
            &prod_id,
            "OPENING",
            "INITIALIZATION",
            &prod_id,
            &now[0..10],
            opening_qty,
            0.0,
            product.purchase_price,
            Some("Opening stock balance initialization"),
        )?;
    }

    Ok(Product {
        id: prod_id,
        current_stock: opening_qty,
        created_at: now,
        ..product
    })
}

#[tauri::command]
pub fn post_sale(state: State<'_, AppState>, input: CreateSaleInput) -> Result<String, String> {
    let mut conn = state.db.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let now = Local::now().to_rfc3339();

    // 1. Generate sequential invoice number
    let count: i64 = tx.query_row(
        "SELECT COUNT(*) FROM sales WHERE company_id = ?1",
        params![input.company_id],
        |r| r.get(0),
    ).unwrap_or(0);
    let invoice_no = format!("INV-{:05}", count + 1);
    let sale_id = Uuid::new_v4().to_string();

    let mut subtotal: i64 = 0;
    let mut discount_total: i64 = 0;
    let mut tax_total: i64 = 0;

    // 2. Validate items, decrease stock, calculate line amounts
    for item in &input.items {
        let item_sub = ((item.quantity * item.rate as f64).round()) as i64;
        let taxable = item_sub - item.discount;
        let item_tax = (taxable * item.tax_rate_bps) / 10000;
        let item_total = taxable + item_tax;

        subtotal += item_sub;
        discount_total += item.discount;
        tax_total += item_tax;

        // Reduce stock atomically with audit trail
        inventory::record_stock_movement(
            &tx,
            &input.company_id,
            &item.product_id,
            "SALE",
            "SALES_INVOICE",
            &sale_id,
            &input.invoice_date,
            0.0,
            item.quantity,
            item.rate,
            Some(&format!("Sold via {}", invoice_no)),
        )?;

        // Record sales item
        let line_id = Uuid::new_v4().to_string();
        tx.execute(
            "INSERT INTO sales_items (id, sale_id, product_id, quantity, rate, discount, tax_rate_bps, tax_amount, total_amount)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![line_id, sale_id, item.product_id, item.quantity, item.rate, item.discount, item.tax_rate_bps, item_tax, item_total],
        ).map_err(|e| e.to_string())?;
    }

    let grand_total = (subtotal - discount_total) + tax_total;

    // 3. Insert sales invoice header
    tx.execute(
        "INSERT INTO sales (id, company_id, invoice_number, invoice_date, customer_id, payment_mode, subtotal, discount_total, tax_total, grand_total, status, notes, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'POSTED', ?11, ?12)",
        params![sale_id, input.company_id, invoice_no, input.invoice_date, input.customer_id, input.payment_mode, subtotal, discount_total, tax_total, grand_total, input.notes, now],
    ).map_err(|e| e.to_string())?;

    // 4. Double-Entry Accounting
    // Look up default system accounts
    let cash_acc_id: String = tx.query_row("SELECT id FROM ledger_accounts WHERE company_id = ?1 AND code = '1001'", params![input.company_id], |r| r.get(0)).map_err(|e| e.to_string())?;
    let sales_acc_id: String = tx.query_row("SELECT id FROM ledger_accounts WHERE company_id = ?1 AND code = '4001'", params![input.company_id], |r| r.get(0)).map_err(|e| e.to_string())?;
    let tax_payable_acc_id: String = tx.query_row("SELECT id FROM ledger_accounts WHERE company_id = ?1 AND code = '2002'", params![input.company_id], |r| r.get(0)).map_err(|e| e.to_string())?;

    let debit_account_id = if input.payment_mode == "Credit" {
        // Customer sub-ledger
        let cust_ledger_id: String = tx.query_row("SELECT ledger_account_id FROM customers WHERE id = ?1", params![input.customer_id], |r| r.get(0)).map_err(|e| format!("Customer required for credit sale: {}", e))?;
        // Update customer balance
        tx.execute("UPDATE customers SET current_balance = current_balance + ?1 WHERE id = ?2", params![grand_total, input.customer_id]).map_err(|e| e.to_string())?;
        cust_ledger_id
    } else {
        cash_acc_id
    };

    let mut journal_lines = vec![
        (debit_account_id, grand_total, 0, Some(format!("Sales invoice {}", invoice_no))),
        (sales_acc_id, 0, subtotal - discount_total, Some(format!("Revenue for {}", invoice_no))),
    ];

    if tax_total > 0 {
        journal_lines.push((tax_payable_acc_id, 0, tax_total, Some(format!("Output tax on {}", invoice_no))));
    }

    accounting::post_journal_entry(
        &tx,
        &input.company_id,
        None,
        "Sales",
        &invoice_no,
        &input.invoice_date,
        Some(&format!("Invoice {} to {:?}", invoice_no, input.customer_id)),
        Some(&sale_id),
        &journal_lines,
    )?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(invoice_no)
}

#[tauri::command]
pub fn post_purchase(state: State<'_, AppState>, input: CreatePurchaseInput) -> Result<String, String> {
    let mut conn = state.db.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    let now = Local::now().to_rfc3339();
    let purchase_id = Uuid::new_v4().to_string();

    let mut subtotal: i64 = 0;
    let mut discount_total: i64 = 0;
    let mut tax_total: i64 = 0;

    // 1. Process items and increase stock
    for item in &input.items {
        let item_sub = ((item.quantity * item.rate as f64).round()) as i64;
        let taxable = item_sub - item.discount;
        let item_tax = (taxable * item.tax_rate_bps) / 10000;
        let item_total = taxable + item_tax;

        subtotal += item_sub;
        discount_total += item.discount;
        tax_total += item_tax;

        inventory::record_stock_movement(
            &tx,
            &input.company_id,
            &item.product_id,
            "PURCHASE",
            "PURCHASE_INVOICE",
            &purchase_id,
            &input.invoice_date,
            item.quantity,
            0.0,
            item.rate,
            Some(&format!("Purchased via {}", input.invoice_number)),
        )?;

        let line_id = Uuid::new_v4().to_string();
        tx.execute(
            "INSERT INTO purchase_items (id, purchase_id, product_id, quantity, rate, discount, tax_rate_bps, tax_amount, total_amount)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![line_id, purchase_id, item.product_id, item.quantity, item.rate, item.discount, item.tax_rate_bps, item_tax, item_total],
        ).map_err(|e| e.to_string())?;
    }

    let grand_total = (subtotal - discount_total) + tax_total;

    // 2. Insert purchase header
    tx.execute(
        "INSERT INTO purchases (id, company_id, purchase_number, purchase_date, supplier_id, payment_mode, subtotal, discount_total, tax_total, grand_total, status, notes, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'POSTED', ?11, ?12)",
        params![purchase_id, input.company_id, input.invoice_number, input.invoice_date, input.supplier_id, input.payment_mode, subtotal, discount_total, tax_total, grand_total, input.notes, now],
    ).map_err(|e| e.to_string())?;

    // 3. Double-entry accounting
    let cash_acc_id: String = tx.query_row("SELECT id FROM ledger_accounts WHERE company_id = ?1 AND code = '1001'", params![input.company_id], |r| r.get(0)).map_err(|e| e.to_string())?;
    let purchase_acc_id: String = tx.query_row("SELECT id FROM ledger_accounts WHERE company_id = ?1 AND code = '5001'", params![input.company_id], |r| r.get(0)).map_err(|e| e.to_string())?;
    let tax_input_acc_id: String = tx.query_row("SELECT id FROM ledger_accounts WHERE company_id = ?1 AND code = '5002'", params![input.company_id], |r| r.get(0)).map_err(|e| e.to_string())?;

    let credit_account_id = if input.payment_mode == "Credit" {
        let supp_ledger_id: String = tx.query_row("SELECT ledger_account_id FROM suppliers WHERE id = ?1", params![input.supplier_id], |r| r.get(0)).map_err(|e| format!("Supplier required for credit purchase: {}", e))?;
        tx.execute("UPDATE suppliers SET current_balance = current_balance + ?1 WHERE id = ?2", params![grand_total, input.supplier_id]).map_err(|e| e.to_string())?;
        supp_ledger_id
    } else {
        cash_acc_id
    };

    let mut journal_lines = vec![
        (purchase_acc_id, subtotal - discount_total, 0, Some(format!("Purchase invoice {}", input.invoice_number))),
    ];

    if tax_total > 0 {
        journal_lines.push((tax_input_acc_id, tax_total, 0, Some(format!("Input tax credit {}", input.invoice_number))));
    }

    journal_lines.push((credit_account_id, 0, grand_total, Some(format!("Payable for purchase {}", input.invoice_number))));

    accounting::post_journal_entry(
        &tx,
        &input.company_id,
        None,
        "Purchase",
        &input.invoice_number,
        &input.invoice_date,
        Some(&format!("Purchase {} from {:?}", input.invoice_number, input.supplier_id)),
        Some(&purchase_id),
        &journal_lines,
    )?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(input.invoice_number)
}

#[tauri::command]
pub fn get_dashboard_metrics(state: State<'_, AppState>, company_id: String) -> Result<DashboardMetrics, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let today = Local::now().format("%Y-%m-%d").to_string();
    let month_prefix = Local::now().format("%Y-%m").to_string();

    let sales_today: i64 = conn.query_row(
        "SELECT COALESCE(SUM(grand_total), 0) FROM sales WHERE company_id = ?1 AND invoice_date = ?2 AND status = 'POSTED'",
        params![company_id, today],
        |r| r.get(0),
    ).unwrap_or(0);

    let sales_month: i64 = conn.query_row(
        "SELECT COALESCE(SUM(grand_total), 0) FROM sales WHERE company_id = ?1 AND invoice_date LIKE ?2 || '%' AND status = 'POSTED'",
        params![company_id, month_prefix],
        |r| r.get(0),
    ).unwrap_or(0);

    let purchases_month: i64 = conn.query_row(
        "SELECT COALESCE(SUM(grand_total), 0) FROM purchases WHERE company_id = ?1 AND purchase_date LIKE ?2 || '%' AND status = 'POSTED'",
        params![company_id, month_prefix],
        |r| r.get(0),
    ).unwrap_or(0);

    let receivables: i64 = conn.query_row(
        "SELECT COALESCE(SUM(current_balance), 0) FROM customers WHERE company_id = ?1",
        params![company_id],
        |r| r.get(0),
    ).unwrap_or(0);

    let payables: i64 = conn.query_row(
        "SELECT COALESCE(SUM(current_balance), 0) FROM suppliers WHERE company_id = ?1",
        params![company_id],
        |r| r.get(0),
    ).unwrap_or(0);

    let stock_val: i64 = conn.query_row(
        "SELECT COALESCE(SUM(current_stock * purchase_price), 0) FROM products WHERE company_id = ?1",
        params![company_id],
        |r| {
            let val: f64 = r.get(0)?;
            Ok(val.round() as i64)
        },
    ).unwrap_or(0);

    let low_stock_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM products WHERE company_id = ?1 AND current_stock <= reorder_level",
        params![company_id],
        |r| r.get(0),
    ).unwrap_or(0);

    // Recent transactions
    let mut stmt = conn.prepare(
        "SELECT id, voucher_type, voucher_number, entry_date, narration, 
         (SELECT SUM(debit) FROM journal_lines WHERE journal_entry_id = journal_entries.id) as amount
         FROM journal_entries WHERE company_id = ?1 ORDER BY created_at DESC LIMIT 6"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![company_id], |row| {
        Ok(RecentTransaction {
            id: row.get(0)?,
            voucher_type: row.get(1)?,
            voucher_number: row.get(2)?,
            date: row.get(3)?,
            party_name: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
            amount: row.get(5)?,
            status: "POSTED".to_string(),
        })
    }).map_err(|e| e.to_string())?;

    let mut recent = Vec::new();
    for r in rows {
        recent.push(r.map_err(|e| e.to_string())?);
    }

    Ok(DashboardMetrics {
        total_sales_today: sales_today,
        total_sales_month: sales_month,
        total_purchases_month: purchases_month,
        total_receivables: receivables,
        total_payables: payables,
        total_stock_value: stock_val,
        low_stock_count,
        recent_transactions: recent,
    })
}

#[tauri::command]
pub fn get_trial_balance(state: State<'_, AppState>, company_id: String) -> Result<Vec<TrialBalanceEntry>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT la.id, la.name, la.account_type,
         COALESCE(SUM(jl.debit), 0) as total_debit,
         COALESCE(SUM(jl.credit), 0) as total_credit
         FROM ledger_accounts la
         LEFT JOIN journal_lines jl ON la.id = jl.ledger_account_id
         WHERE la.company_id = ?1
         GROUP BY la.id ORDER BY la.code ASC"
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map(params![company_id], |row| {
        let deb: i64 = row.get(3)?;
        let cred: i64 = row.get(4)?;
        Ok(TrialBalanceEntry {
            account_id: row.get(0)?,
            account_name: row.get(1)?,
            account_type: row.get(2)?,
            debit_total: deb,
            credit_total: cred,
            net_balance: deb - cred,
        })
    }).map_err(|e| e.to_string())?;

    let mut tb = Vec::new();
    for r in rows {
        tb.push(r.map_err(|e| e.to_string())?);
    }
    Ok(tb)
}

trait EmptyHelper {
    fn if_empty(self, fallback: &str) -> String;
}

impl EmptyHelper for String {
    fn if_empty(self, fallback: &str) -> String {
        if self.trim().is_empty() {
            fallback.to_string()
        } else {
            self
        }
    }
}
