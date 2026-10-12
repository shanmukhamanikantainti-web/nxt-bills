import { invoke } from "@tauri-apps/api/core";

export interface Company {
  id: string;
  name: string;
  trade_name?: string;
  tax_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  currency_symbol: string;
  currency_code: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  ledger_account_id: string;
  name: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  opening_balance: number;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  company_id: string;
  ledger_account_id: string;
  name: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface Product {
  id: string;
  company_id: string;
  category_id?: string;
  unit_id?: string;
  name: string;
  code: string;
  sku?: string;
  hsn_code?: string;
  purchase_price: number; // in paise/cents
  selling_price: number;
  tax_rate_bps: number; // 1800 = 18%
  current_stock: number;
  reorder_level: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface RecentTransaction {
  id: string;
  voucher_type: string;
  voucher_number: string;
  date: string;
  party_name: string;
  amount: number;
  status: string;
}

export interface DashboardMetrics {
  total_sales_today: number;
  total_sales_month: number;
  total_purchases_month: number;
  total_receivables: number;
  total_payables: number;
  total_stock_value: number;
  low_stock_count: number;
  recent_transactions: RecentTransaction[];
}

export interface TrialBalanceEntry {
  account_id: string;
  account_name: string;
  account_type: string;
  debit_total: number;
  credit_total: number;
  net_balance: number;
}

export type DeploymentMode = "Installed" | "Portable";

export interface StorageInfo {
  mode: DeploymentMode;
  application_root: string;
  data_directory: string;
  database_path: string;
  documents_directory: string;
  backups_directory: string;
  imports_directory: string;
  exports_directory: string;
  config_directory: string;
  logs_directory: string;
  temp_directory: string;
  is_usb_portable: boolean;
  is_connected: boolean;
  last_checked: string;
}

export interface PackageFileEntry {
  path: string;
  sha256: string;
  size_bytes: number;
}

export interface TransferManifest {
  manifest_version: string;
  app_version: string;
  schema_version: number;
  package_version: string;
  company_id?: string;
  company_name?: string;
  created_at: string;
  files: PackageFileEntry[];
}

export interface ValidationResult {
  is_valid: boolean;
  manifest?: TransferManifest;
  checks: string[];
  errors: string[];
  warnings: string[];
}

export interface ExportPackageResult {
  success: boolean;
  export_path: string;
  manifest: TransferManifest;
  message: string;
}

export interface ImportPackageResult {
  success: boolean;
  safety_backup_path?: string;
  message: string;
}

export interface LegacyCustomerRow {
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  opening_balance?: number;
}

export interface LegacySupplierRow {
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  tax_number?: string;
  opening_balance?: number;
}

export interface LegacyProductRow {
  name: string;
  code?: string;
  purchase_price?: number;
  selling_price?: number;
  opening_stock?: number;
  tax_rate_bps?: number;
}

export interface LegacyImportPayload {
  company_id: string;
  customers: LegacyCustomerRow[];
  suppliers: LegacySupplierRow[];
  products: LegacyProductRow[];
}

export interface ImportSummaryReport {
  total_processed: number;
  imported_successfully: number;
  warnings_count: number;
  rejected_count: number;
  customers_imported: number;
  suppliers_imported: number;
  products_imported: number;
  warnings: string[];
  rejected_details: string[];
}

export interface SalesItemInput {
  product_id: string;
  quantity: number;
  rate: number;
  discount: number;
  tax_rate_bps: number;
}

export interface CreateSaleInput {
  company_id: string;
  customer_id?: string;
  invoice_date: string;
  payment_mode: string;
  notes?: string;
  items: SalesItemInput[];
}

export interface PurchaseItemInput {
  product_id: string;
  quantity: number;
  rate: number;
  discount: number;
  tax_rate_bps: number;
}

export interface CreatePurchaseInput {
  company_id: string;
  supplier_id?: string;
  invoice_number: string;
  invoice_date: string;
  payment_mode: string;
  notes?: string;
  items: PurchaseItemInput[];
}

// Format minor unit (paise) to display currency string
export function formatCurrency(amountMinor: number, symbol = "₹"): string {
  const val = (amountMinor / 100).toFixed(2);
  return `${symbol} ${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Strongly typed Tauri IPC service client
export const api = {
  getStorageStatus: () => invoke<StorageInfo>("get_storage_status"),
  backupDatabase: () => invoke<string>("backup_database"),
  safeEject: () => invoke<string>("safe_eject"),
  resolveDocumentPath: (relativePath: string) => invoke<string>("resolve_document_path", { relativePath }),
  exportTransferPackage: (targetDir: string) => invoke<ExportPackageResult>("export_transfer_package", { targetDir }),
  validateTransferPackage: (packageDir: string) => invoke<ValidationResult>("validate_transfer_package", { packageDir }),
  importTransferPackage: (packageDir: string) => invoke<ImportPackageResult>("import_transfer_package", { packageDir }),
  importLegacyData: (payload: LegacyImportPayload) => invoke<ImportSummaryReport>("import_legacy_data", { payload }),
  getCompany: () => invoke<Company | null>("get_company"),
  saveCompany: (company: Company) => invoke<Company>("save_company", { company }),
  listCustomers: (companyId: string) => invoke<Customer[]>("list_customers", { companyId }),
  createCustomer: (customer: Customer) => invoke<Customer>("create_customer", { customer }),
  listSuppliers: (companyId: string) => invoke<Supplier[]>("list_suppliers", { companyId }),
  createSupplier: (supplier: Supplier) => invoke<Supplier>("create_supplier", { supplier }),
  listProducts: (companyId: string) => invoke<Product[]>("list_products", { companyId }),
  createProduct: (product: Product, openingQty: number) => invoke<Product>("create_product", { product, openingQty }),
  postSale: (input: CreateSaleInput) => invoke<string>("post_sale", { input }),
  postPurchase: (input: CreatePurchaseInput) => invoke<string>("post_purchase", { input }),
  getDashboardMetrics: (companyId: string) => invoke<DashboardMetrics>("get_dashboard_metrics", { companyId }),
  getTrialBalance: (companyId: string) => invoke<TrialBalanceEntry[]>("get_trial_balance", { companyId }),
};
