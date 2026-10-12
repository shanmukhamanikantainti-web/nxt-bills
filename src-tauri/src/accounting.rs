use rusqlite::{params, Connection, Result};
use uuid::Uuid;
use chrono::Local;

pub fn seed_company_defaults(conn: &Connection, company_id: &str) -> Result<()> {
    let now = Local::now().to_rfc3339();

    // Default System Ledgers
    let default_accounts = vec![
        // Assets
        ("1001", "Cash on Hand", "Asset", true, 0),
        ("1002", "Bank Account", "Asset", true, 0),
        ("1003", "Accounts Receivable (Debtors)", "Asset", true, 0),
        ("1004", "Inventory / Stock in Hand", "Asset", true, 0),
        // Liabilities
        ("2001", "Accounts Payable (Creditors)", "Liability", true, 0),
        ("2002", "Output Tax Payable (GST/Tax)", "Liability", true, 0),
        // Equity
        ("3001", "Owner's Capital", "Equity", true, 0),
        ("3002", "Opening Balance Equity", "Equity", true, 0),
        // Revenue
        ("4001", "Sales Revenue", "Revenue", true, 0),
        ("4002", "Other Income", "Revenue", true, 0),
        // Expenses
        ("5001", "Cost of Goods Sold (Purchases)", "Expense", true, 0),
        ("5002", "Input Tax Credit", "Asset", true, 0),
        ("5003", "Discount Allowed", "Expense", true, 0),
        ("5004", "General & Administrative Expenses", "Expense", true, 0),
    ];

    for (code, name, acc_type, is_sys, opening) in default_accounts {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT OR IGNORE INTO ledger_accounts 
             (id, company_id, code, name, account_type, is_system, opening_balance, current_balance, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![id, company_id, code, name, acc_type, is_sys as i32, opening, opening, now],
        )?;
    }

    // Default Units
    let units = vec![("PCS", "Pieces"), ("NOS", "Numbers"), ("KG", "Kilograms"), ("BOX", "Boxes")];
    for (code, name) in units {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT OR IGNORE INTO units (id, company_id, code, name) VALUES (?1, ?2, ?3, ?4)",
            params![id, company_id, code, name],
        )?;
    }

    // Default Category
    let cat_id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT OR IGNORE INTO product_categories (id, company_id, name, code) VALUES (?1, ?2, 'General', 'GEN')",
        params![cat_id, company_id],
    )?;

    Ok(())
}

pub fn post_journal_entry(
    conn: &Connection,
    company_id: &str,
    financial_year_id: Option<&str>,
    voucher_type: &str,
    voucher_number: &str,
    entry_date: &str,
    narration: Option<&str>,
    reference_id: Option<&str>,
    lines: &[(String, i64, i64, Option<String>)], // (account_id, debit, credit, desc)
) -> Result<String, String> {
    // 1. Double entry validation: TOTAL DEBIT MUST EQUAL TOTAL CREDIT
    let total_debit: i64 = lines.iter().map(|(_, d, _, _)| *d).sum();
    let total_credit: i64 = lines.iter().map(|(_, _, c, _)| *c).sum();

    if total_debit != total_credit {
        return Err(format!(
            "Accounting rule violation: Unbalanced journal entry! Total Debit ({}) != Total Credit ({})",
            total_debit, total_credit
        ));
    }

    if total_debit <= 0 {
        return Err("Accounting rule violation: Journal transaction total must be greater than zero.".to_string());
    }

    let journal_id = Uuid::new_v4().to_string();
    let now = Local::now().to_rfc3339();

    // Insert journal header
    conn.execute(
        "INSERT INTO journal_entries (id, company_id, financial_year_id, voucher_type, voucher_number, entry_date, narration, reference_id, is_posted, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1, ?9)",
        params![journal_id, company_id, financial_year_id, voucher_type, voucher_number, entry_date, narration, reference_id, now],
    ).map_err(|e| format!("Failed to create journal entry: {}", e))?;

    // Insert lines and update ledger current balances atomically
    for (idx, (acc_id, debit, credit, desc)) in lines.iter().enumerate() {
        let line_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO journal_lines (id, journal_entry_id, ledger_account_id, debit, credit, description, line_order)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![line_id, journal_id, acc_id, debit, credit, desc, idx as i32],
        ).map_err(|e| format!("Failed to write journal line: {}", e))?;

        // Update account running balance according to account type
        let (acc_type,): (String,) = conn.query_row(
            "SELECT account_type FROM ledger_accounts WHERE id = ?1",
            params![acc_id],
            |row| Ok((row.get(0)?,)),
        ).map_err(|e| format!("Account {} not found: {}", acc_id, e))?;

        // For Assets and Expenses, Debit increases balance, Credit decreases balance.
        // For Liabilities, Equity, and Revenue, Credit increases balance, Debit decreases balance.
        let balance_delta = match acc_type.as_str() {
            "Asset" | "Expense" => debit - credit,
            _ => credit - debit,
        };

        conn.execute(
            "UPDATE ledger_accounts SET current_balance = current_balance + ?1 WHERE id = ?2",
            params![balance_delta, acc_id],
        ).map_err(|e| format!("Failed to update ledger balance: {}", e))?;
    }

    Ok(journal_id)
}
