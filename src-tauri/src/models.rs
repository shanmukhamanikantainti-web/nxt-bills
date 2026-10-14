use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Company {
    pub id: String,
    pub name: String,
    pub trade_name: Option<String>,
    pub tax_number: Option<String>, // GSTIN / Tax ID
    pub address_line1: Option<String>,
    pub address_line2: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub currency_symbol: String,
    pub currency_code: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FinancialYear {
    pub id: String,
    pub company_id: String,
    pub code: String, // e.g. "FY2026-27"
    pub start_date: String,
    pub end_date: String,
    pub is_closed: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum AccountType {
    Asset,
    Liability,
    Equity,
    Revenue,
    Expense,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LedgerAccount {
    pub id: String,
    pub company_id: String,
    pub code: String,
    pub name: String,
    pub account_type: String, // Asset, Liability, Equity, Revenue, Expense
    pub parent_id: Option<String>,
    pub is_system: bool,
    pub is_active: bool,
    pub opening_balance: i64, // Minor units (e.g., paise)
    pub current_balance: i64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Customer {
    pub id: String,
    pub company_id: String,
    pub ledger_account_id: String,
    pub name: String,
    pub code: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub tax_number: Option<String>,
    pub opening_balance: i64,
    pub credit_limit: i64,
    pub current_balance: i64,
    pub is_active: bool,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Supplier {
    pub id: String,
    pub company_id: String,
    pub ledger_account_id: String,
    pub name: String,
    pub code: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address: Option<String>,
    pub tax_number: Option<String>,
    pub opening_balance: i64,
    pub current_balance: i64,
    pub is_active: bool,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProductCategory {
    pub id: String,
    pub company_id: String,
    pub name: String,
    pub code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Unit {
    pub id: String,
    pub company_id: String,
    pub code: String, // e.g. "PCS", "KG", "BOX"
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Product {
    pub id: String,
    pub company_id: String,
    pub category_id: Option<String>,
    pub unit_id: Option<String>,
    pub name: String,
    pub code: String,
    pub sku: Option<String>,
    pub hsn_code: Option<String>,
    pub purchase_price: i64, // In minor units (paise)
    pub selling_price: i64,
    pub tax_rate_bps: i64, // Basis points (e.g., 18% = 1800 bps)
    pub current_stock: f64,
    pub reorder_level: f64,
    pub is_active: bool,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SalesItemInput {
    pub product_id: String,
    pub quantity: f64,
    pub rate: i64,
    pub discount: i64,
    pub tax_rate_bps: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateSaleInput {
    pub company_id: String,
    pub customer_id: Option<String>,
    pub invoice_date: String,
    pub payment_mode: String, // "Cash", "Bank", "Credit"
    pub notes: Option<String>,
    pub items: Vec<SalesItemInput>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PurchaseItemInput {
    pub product_id: String,
    pub quantity: f64,
    pub rate: i64,
    pub discount: i64,
    pub tax_rate_bps: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreatePurchaseInput {
    pub company_id: String,
    pub supplier_id: Option<String>,
    pub invoice_number: String,
    pub invoice_date: String,
    pub payment_mode: String, // "Cash", "Bank", "Credit"
    pub notes: Option<String>,
    pub items: Vec<PurchaseItemInput>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StockAdjustmentInput {
    pub company_id: String,
    pub product_id: String,
    pub adjustment_type: String, // "IN" or "OUT"
    pub quantity: f64,
    pub rate: i64,
    pub reason: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NoteItemInput {
    pub product_id: Option<String>,
    pub quantity: f64,
    pub rate: i64,
    pub tax_rate_bps: i64,
    pub amount: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateDebitNoteInput {
    pub company_id: String,
    pub supplier_id: String,
    pub reference_invoice: Option<String>,
    pub note_date: String,
    pub reason: String,
    pub items: Vec<NoteItemInput>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateCreditNoteInput {
    pub company_id: String,
    pub customer_id: String,
    pub reference_invoice: Option<String>,
    pub note_date: String,
    pub reason: String,
    pub items: Vec<NoteItemInput>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PaymentReceiptInput {
    pub company_id: String,
    pub party_type: String, // "Customer", "Supplier", "Direct"
    pub party_id: Option<String>,
    pub ledger_account_id: String,
    pub payment_account_id: String, // Cash or Bank account
    pub amount: i64,
    pub transaction_date: String,
    pub reference_number: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardMetrics {
    pub total_sales_today: i64,
    pub total_sales_month: i64,
    pub total_purchases_month: i64,
    pub total_receivables: i64,
    pub total_payables: i64,
    pub total_stock_value: i64,
    pub low_stock_count: i64,
    pub recent_transactions: Vec<RecentTransaction>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecentTransaction {
    pub id: String,
    pub voucher_type: String,
    pub voucher_number: String,
    pub date: String,
    pub party_name: String,
    pub amount: i64,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrialBalanceEntry {
    pub account_id: String,
    pub account_name: String,
    pub account_type: String,
    pub debit_total: i64,
    pub credit_total: i64,
    pub net_balance: i64, // positive = debit, negative = credit
}

// User & Role Management Models
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub role_id: String, // ADMIN, MANAGER, ACCOUNTANT, BILLING_OPERATOR, VIEWER
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
    pub last_login_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateUserInput {
    pub username: String,
    pub display_name: String,
    pub password: String,
    pub role_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UpdateUserInput {
    pub id: String,
    pub display_name: String,
    pub role_id: String,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LoginInput {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LoginResult {
    pub success: bool,
    pub user: Option<User>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserCounts {
    pub total_users: i64,
    pub active_users: i64,
    pub inactive_users: i64,
}

// Audit Models
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditLog {
    pub id: String,
    pub user_id: Option<String>,
    pub username_snapshot: String,
    pub action: String,
    pub entity_type: String,
    pub entity_id: Option<String>,
    pub description: String,
    pub timestamp: String,
    pub metadata: Option<String>,
}

// Invoice Print Audit Models
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InvoicePrintAudit {
    pub id: String,
    pub invoice_id: String,
    pub invoice_number: String,
    pub user_id: Option<String>,
    pub username_snapshot: String,
    pub printed_at: String,
    pub print_type: String, // PRINT, PDF, PREVIEW
    pub printer_name: Option<String>,
    pub document_type: String, // TAX_INVOICE, BILL_OF_SUPPLY, etc.
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecordPrintInput {
    pub invoice_id: String,
    pub invoice_number: String,
    pub user_id: Option<String>,
    pub username_snapshot: String,
    pub print_type: String,
    pub printer_name: Option<String>,
    pub document_type: String,
}

