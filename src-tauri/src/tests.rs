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
}
