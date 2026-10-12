use rusqlite::{params, Connection, Result};
use uuid::Uuid;
use chrono::Local;

pub fn record_stock_movement(
    conn: &Connection,
    company_id: &str,
    product_id: &str,
    transaction_type: &str,
    reference_type: &str,
    reference_id: &str,
    transaction_date: &str,
    quantity_in: f64,
    quantity_out: f64,
    unit_rate: i64,
    notes: Option<&str>,
) -> Result<f64, String> {
    if quantity_in < 0.0 || quantity_out < 0.0 {
        return Err("Stock quantities cannot be negative".to_string());
    }

    // Retrieve current stock
    let current_stock: f64 = conn.query_row(
        "SELECT current_stock FROM products WHERE id = ?1 AND company_id = ?2",
        params![product_id, company_id],
        |row| row.get(0),
    ).map_err(|e| format!("Product not found: {}", e))?;

    let new_stock = current_stock + quantity_in - quantity_out;
    if new_stock < 0.0 && quantity_out > 0.0 {
        return Err(format!(
            "Insufficient stock! Available: {}, Requested: {}",
            current_stock, quantity_out
        ));
    }

    let tx_id = Uuid::new_v4().to_string();
    let now = Local::now().to_rfc3339();

    // 1. Record stock transaction record in audit trail
    conn.execute(
        "INSERT INTO stock_transactions 
         (id, company_id, product_id, transaction_type, reference_type, reference_id, transaction_date, quantity_in, quantity_out, unit_rate, balance_after, notes, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            tx_id,
            company_id,
            product_id,
            transaction_type,
            reference_type,
            reference_id,
            transaction_date,
            quantity_in,
            quantity_out,
            unit_rate,
            new_stock,
            notes,
            now
        ],
    ).map_err(|e| format!("Failed to record stock transaction: {}", e))?;

    // 2. Update current stock in product table
    conn.execute(
        "UPDATE products SET current_stock = ?1 WHERE id = ?2",
        params![new_stock, product_id],
    ).map_err(|e| format!("Failed to update product stock: {}", e))?;

    Ok(new_stock)
}
