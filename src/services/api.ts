import { invoke } from "@tauri-apps/api/core";

export interface Company {
  id: string;
  name: string;
  trade_name?: string;
  tax_number?: string;
  pan?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  state_code?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency_symbol: string;
  currency_code: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  bank_upi_id?: string;
  invoice_prefix?: string;
  invoice_format?: string;
  accent_color?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  ledger_account_id: string;
  name: string;
  trade_name?: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  state_code?: string;
  postal_code?: string;
  tax_number?: string; // GSTIN
  pan?: string;
  registration_type?: string; // Regular, Composition, Unregistered, Consumer
  customer_type?: string; // Retailer, Wholesaler, Institutional
  credit_limit: number;
  credit_days?: number;
  opening_balance: number;
  opening_balance_type?: string; // Dr / Cr
  current_balance: number;
  billing_address?: string;
  shipping_address?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  company_id: string;
  ledger_account_id: string;
  name: string;
  trade_name?: string;
  code: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
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
  category?: string;
  unit?: string;
  purchase_price: number; // in paise/cents
  selling_price: number;
  mrp?: number;
  tax_rate_bps: number; // 1800 = 18%
  current_stock: number;
  reorder_level: number;
  max_stock?: number;
  barcode?: string;
  batch_number?: string;
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

export interface User {
  id: string;
  username: string;
  display_name: string;
  role_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface CreateUserInput {
  username: string;
  display_name: string;
  password: string;
  role_id: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  message: string;
}

export interface UserCounts {
  total_users: number;
  active_users: number;
  inactive_users: number;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  username_snapshot: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  timestamp: string;
  metadata?: string;
}

export interface InvoicePrintAudit {
  id: string;
  invoice_id: string;
  invoice_number: string;
  user_id?: string;
  username_snapshot: string;
  printed_at: string;
  print_type: string;
  printer_name?: string;
  document_type: string;
  status: string;
}

export interface RecordPrintInput {
  invoice_id: string;
  invoice_number: string;
  user_id?: string;
  username_snapshot: string;
  print_type: string;
  printer_name?: string;
  document_type: string;
}

// Format minor unit (paise) to display currency string
export function formatCurrency(amountMinor: number, symbol = "₹"): string {
  const val = (amountMinor / 100).toFixed(2);
  return `${symbol} ${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Check if running within native Tauri desktop window
export const isTauriEnvironment = (): boolean => {
  return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
};

// Fallback in-memory / local storage driver for standalone browser preview / testing
const mockStorageKey = (key: string) => `sdl_acc_${key}`;

function getLocalMock<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(mockStorageKey(key));
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalMock<T>(key: string, value: T): void {
  try {
    localStorage.setItem(mockStorageKey(key), JSON.stringify(value));
  } catch {}
}

// Strongly typed Tauri IPC service client with seamless browser fallback
export const api = {
  getStorageStatus: async (): Promise<StorageInfo> => {
    if (isTauriEnvironment()) {
      return invoke<StorageInfo>("get_storage_status");
    }
    return {
      mode: "Installed",
      application_root: "C:\\Program Files\\SDL_ACC",
      data_directory: "C:\\ProgramData\\SDL_ACC\\Data",
      database_path: "C:\\ProgramData\\SDL_ACC\\Data\\sdl_acc.db",
      documents_directory: "C:\\ProgramData\\SDL_ACC\\Documents",
      backups_directory: "C:\\ProgramData\\SDL_ACC\\Backups",
      imports_directory: "C:\\ProgramData\\SDL_ACC\\Imports",
      exports_directory: "C:\\ProgramData\\SDL_ACC\\Exports",
      config_directory: "C:\\ProgramData\\SDL_ACC\\Config",
      logs_directory: "C:\\ProgramData\\SDL_ACC\\Logs",
      temp_directory: "C:\\ProgramData\\SDL_ACC\\Temp",
      is_usb_portable: false,
      is_connected: true,
      last_checked: new Date().toISOString(),
    };
  },

  backupDatabase: async (): Promise<string> => {
    if (isTauriEnvironment()) {
      return invoke<string>("backup_database");
    }
    return "C:\\ProgramData\\SDL_ACC\\Backups\\sdl_acc_backup_manual.db";
  },

  safeEject: async (): Promise<string> => {
    if (isTauriEnvironment()) {
      return invoke<string>("safe_eject");
    }
    return "Storage flushed and ready for safe removal";
  },

  resolveDocumentPath: async (relativePath: string): Promise<string> => {
    if (isTauriEnvironment()) {
      return invoke<string>("resolve_document_path", { relativePath });
    }
    return `C:\\ProgramData\\SDL_ACC\\Documents\\${relativePath}`;
  },

  exportTransferPackage: async (targetDir: string): Promise<ExportPackageResult> => {
    if (isTauriEnvironment()) {
      return invoke<ExportPackageResult>("export_transfer_package", { targetDir });
    }
    return {
      success: true,
      export_path: `${targetDir}\\SDL_ACC_TRANSFER_PKG`,
      message: "Transfer package created successfully",
      manifest: {
        manifest_version: "1.0",
        app_version: "1.0.0",
        schema_version: 1,
        package_version: "20261013",
        created_at: new Date().toISOString(),
        files: [],
      },
    };
  },

  validateTransferPackage: async (packageDir: string): Promise<ValidationResult> => {
    if (isTauriEnvironment()) {
      return invoke<ValidationResult>("validate_transfer_package", { packageDir });
    }
    return {
      is_valid: true,
      checks: ["Checksum validation passed", "PRAGMA integrity check OK", "Manifest verified"],
      errors: [],
      warnings: [],
    };
  },

  importTransferPackage: async (packageDir: string): Promise<ImportPackageResult> => {
    if (isTauriEnvironment()) {
      return invoke<ImportPackageResult>("import_transfer_package", { packageDir });
    }
    return {
      success: true,
      message: "Package imported successfully in browser mode",
      safety_backup_path: "C:\\ProgramData\\SDL_ACC\\Backups\\pre_import_safety.db",
    };
  },

  importLegacyData: async (payload: LegacyImportPayload): Promise<ImportSummaryReport> => {
    if (isTauriEnvironment()) {
      return invoke<ImportSummaryReport>("import_legacy_data", { payload });
    }
    return {
      total_processed: payload.customers.length + payload.suppliers.length + payload.products.length,
      imported_successfully: payload.customers.length + payload.suppliers.length + payload.products.length,
      warnings_count: 0,
      rejected_count: 0,
      customers_imported: payload.customers.length,
      suppliers_imported: payload.suppliers.length,
      products_imported: payload.products.length,
      warnings: [],
      rejected_details: [],
    };
  },

  getCompany: async (): Promise<Company | null> => {
    if (isTauriEnvironment()) {
      return invoke<Company | null>("get_company");
    }
    const saved = getLocalMock<Company | null>("company", null);
    if (saved) return saved;
    // Default initial profile based on Dhanalakshmi Agencies invoice reference
    const defaultCompany: Company = {
      id: "comp-001",
      name: "SRI DHANALAKSHMI AGENCIES",
      trade_name: "SRI DHANALAKSHMI AGENCIES",
      tax_number: "33AABCS1429B1Z",
      pan: "AABCS1429B",
      address_line1: "8/12, Market Feeder Road",
      address_line2: "Near Old Bus Stand",
      city: "Tiruppur",
      state: "Tamil Nadu",
      state_code: "33",
      postal_code: "641601",
      phone: "+91 94432 10987",
      email: "sdlagencies@gmail.com",
      website: "www.dhanalakshmiagencies.com",
      currency_symbol: "₹",
      currency_code: "INR",
      bank_name: "State Bank of India",
      bank_branch: "Tiruppur Main Branch",
      bank_account_no: "30894561234",
      bank_ifsc: "SBIN0000938",
      bank_upi_id: "sdlagencies@sbi",
      invoice_prefix: "DA",
      invoice_format: "{PREFIX}/{FY}/{NUM:6}",
      accent_color: "#D4121C",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocalMock("company", defaultCompany);
    return defaultCompany;
  },

  saveCompany: async (company: Company): Promise<Company> => {
    if (isTauriEnvironment()) {
      return invoke<Company>("save_company", { company });
    }
    const updated = {
      ...company,
      id: company.id || "comp-001",
      updated_at: new Date().toISOString(),
    };
    setLocalMock("company", updated);
    return updated;
  },

  listCustomers: async (companyId: string): Promise<Customer[]> => {
    if (isTauriEnvironment()) {
      return invoke<Customer[]>("list_customers", { companyId });
    }
    const defaultCusts: Customer[] = [
      {
        id: "cust-01",
        company_id: companyId,
        ledger_account_id: "ledg-cust-01",
        name: "SRI BALAJI TEXTILES & GARMENTS",
        trade_name: "Balaji Textiles",
        code: "CUST-001",
        phone: "9842156789",
        email: "balaji.garments@yahoo.com",
        address: "45, Kumaran Road, Kannipiran Colony",
        city: "Tiruppur",
        state: "Tamil Nadu",
        state_code: "33",
        postal_code: "641602",
        tax_number: "33AADCB2241C1Z4",
        pan: "AADCB2241C",
        registration_type: "Regular",
        customer_type: "Wholesaler",
        credit_limit: 50000000,
        credit_days: 30,
        opening_balance: 0,
        current_balance: 14250000,
        billing_address: "45, Kumaran Road, Kannipiran Colony, Tiruppur - 641602",
        shipping_address: "Godown No. 3, Angeripalayam Main Road, Tiruppur - 641603",
        is_active: true,
        notes: "Preferred regular dealer",
        created_at: new Date().toISOString(),
      },
      {
        id: "cust-02",
        company_id: companyId,
        ledger_account_id: "ledg-cust-02",
        name: "MURUGAN KNITTING MILLS",
        trade_name: "Murugan Knitwear",
        code: "CUST-002",
        phone: "9843098765",
        email: "muruganmills@gmail.com",
        address: "12, College Road",
        city: "Tiruppur",
        state: "Tamil Nadu",
        state_code: "33",
        postal_code: "641602",
        tax_number: "33AAEFM5521A1ZB",
        pan: "AAEFM5521A",
        registration_type: "Regular",
        customer_type: "Manufacturer",
        credit_limit: 100000000,
        credit_days: 45,
        opening_balance: 5000000,
        current_balance: 8500000,
        billing_address: "12, College Road, Tiruppur",
        shipping_address: "12, College Road, Tiruppur",
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
    return getLocalMock<Customer[]>("customers", defaultCusts);
  },

  createCustomer: async (customer: Customer): Promise<Customer> => {
    if (isTauriEnvironment()) {
      return invoke<Customer>("create_customer", { customer });
    }
    const current = getLocalMock<Customer[]>("customers", []);
    const newCust: Customer = {
      ...customer,
      id: customer.id || `cust-${Date.now()}`,
      ledger_account_id: `ledg-${Date.now()}`,
      current_balance: customer.opening_balance || 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    current.push(newCust);
    setLocalMock("customers", current);
    return newCust;
  },

  listSuppliers: async (companyId: string): Promise<Supplier[]> => {
    if (isTauriEnvironment()) {
      return invoke<Supplier[]>("list_suppliers", { companyId });
    }
    const defaultSupps: Supplier[] = [
      {
        id: "supp-01",
        company_id: companyId,
        ledger_account_id: "ledg-supp-01",
        name: "BHARAT YARN DISTRIBUTORS",
        trade_name: "Bharat Yarns",
        code: "SUPP-001",
        phone: "9443123456",
        email: "bharatyarn@gmail.com",
        address: "108, Cotton Market Yard",
        city: "Coimbatore",
        state: "Tamil Nadu",
        tax_number: "33AAACB9912K1Z8",
        opening_balance: 0,
        current_balance: 4200000,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
    return getLocalMock<Supplier[]>("suppliers", defaultSupps);
  },

  createSupplier: async (supplier: Supplier): Promise<Supplier> => {
    if (isTauriEnvironment()) {
      return invoke<Supplier>("create_supplier", { supplier });
    }
    const current = getLocalMock<Supplier[]>("suppliers", []);
    const newSupp: Supplier = {
      ...supplier,
      id: supplier.id || `supp-${Date.now()}`,
      ledger_account_id: `ledg-supp-${Date.now()}`,
      current_balance: supplier.opening_balance || 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    current.push(newSupp);
    setLocalMock("suppliers", current);
    return newSupp;
  },

  listProducts: async (companyId: string): Promise<Product[]> => {
    if (isTauriEnvironment()) {
      return invoke<Product[]>("list_products", { companyId });
    }
    const defaultProds: Product[] = [
      {
        id: "prod-01",
        company_id: companyId,
        name: "Combed Cotton Yarn 30s Count",
        code: "YRN-30C",
        sku: "YRN-30C-WHT",
        hsn_code: "52051210",
        category: "Raw Yarn",
        unit: "KGS",
        purchase_price: 26000, // ₹260.00
        selling_price: 31000, // ₹310.00
        mrp: 35000,
        tax_rate_bps: 500, // 5% GST
        current_stock: 450,
        reorder_level: 50,
        max_stock: 1000,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "prod-02",
        company_id: companyId,
        name: "Single Jersey Knitted Fabric (Navy Blue)",
        code: "FAB-SJ-NVY",
        sku: "FAB-SJ-NVY-180",
        hsn_code: "60062200",
        category: "Knitted Fabrics",
        unit: "KGS",
        purchase_price: 34000, // ₹340.00
        selling_price: 42000, // ₹420.00
        mrp: 48000,
        tax_rate_bps: 500, // 5% GST
        current_stock: 280,
        reorder_level: 40,
        max_stock: 800,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "prod-03",
        company_id: companyId,
        name: "Industrial Sewing Thread Spool 5000m",
        code: "THR-5000M",
        sku: "THR-5000-WHT",
        hsn_code: "54011000",
        category: "Accessories",
        unit: "BOX",
        purchase_price: 12000, // ₹120.00
        selling_price: 16500, // ₹165.00
        mrp: 19000,
        tax_rate_bps: 1200, // 12% GST
        current_stock: 120,
        reorder_level: 25,
        max_stock: 300,
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "prod-04",
        company_id: companyId,
        name: "Packing Polybags 12x18 Gauge 100",
        code: "PKG-PB-1218",
        sku: "PKG-PB-1218",
        hsn_code: "39232100",
        category: "Packaging Material",
        unit: "PKT",
        purchase_price: 8500, // ₹85.00
        selling_price: 11000, // ₹110.00
        mrp: 13000,
        tax_rate_bps: 1800, // 18% GST
        current_stock: 65,
        reorder_level: 20,
        max_stock: 200,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ];
    return getLocalMock<Product[]>("products", defaultProds);
  },

  createProduct: async (product: Product, openingQty: number): Promise<Product> => {
    if (isTauriEnvironment()) {
      return invoke<Product>("create_product", { product, openingQty });
    }
    const current = getLocalMock<Product[]>("products", []);
    const newProd: Product = {
      ...product,
      id: product.id || `prod-${Date.now()}`,
      current_stock: openingQty || 0,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    current.push(newProd);
    setLocalMock("products", current);
    return newProd;
  },

  postSale: async (input: CreateSaleInput): Promise<string> => {
    if (isTauriEnvironment()) {
      return invoke<string>("post_sale", { input });
    }
    const salesCount = getLocalMock<number>("sales_count", 1);
    const invoiceNo = `DA/2026-27/${String(salesCount).padStart(6, "0")}`;
    setLocalMock("sales_count", salesCount + 1);

    // Update product stock and customer balance in local mock
    const prods = getLocalMock<Product[]>("products", []);
    for (const item of input.items) {
      const idx = prods.findIndex((p) => p.id === item.product_id);
      if (idx !== -1) {
        prods[idx].current_stock = Math.max(0, prods[idx].current_stock - item.quantity);
      }
    }
    setLocalMock("products", prods);

    return invoiceNo;
  },

  postPurchase: async (input: CreatePurchaseInput): Promise<string> => {
    if (isTauriEnvironment()) {
      return invoke<string>("post_purchase", { input });
    }
    // Update product stock in local mock
    const prods = getLocalMock<Product[]>("products", []);
    for (const item of input.items) {
      const idx = prods.findIndex((p) => p.id === item.product_id);
      if (idx !== -1) {
        prods[idx].current_stock += item.quantity;
      }
    }
    setLocalMock("products", prods);
    return input.invoice_number;
  },

  getDashboardMetrics: async (companyId: string): Promise<DashboardMetrics> => {
    if (isTauriEnvironment()) {
      return invoke<DashboardMetrics>("get_dashboard_metrics", { companyId });
    }
    return {
      total_sales_today: 4850000, // ₹48,500.00
      total_sales_month: 345000000, // ₹34,50,000.00
      total_purchases_month: 215000000, // ₹21,50,000.00
      total_receivables: 22750000, // ₹2,27,500.00
      total_payables: 4200000, // ₹42,000.00
      total_stock_value: 32675000, // ₹3,26,750.00
      low_stock_count: 0,
      recent_transactions: [
        {
          id: "tx-01",
          voucher_type: "Sales Invoice",
          voucher_number: "DA/2026-27/000008",
          date: new Date().toISOString().split("T")[0],
          party_name: "SRI BALAJI TEXTILES & GARMENTS",
          amount: 4850000,
          status: "POSTED",
        },
        {
          id: "tx-02",
          voucher_type: "Purchase Invoice",
          voucher_number: "PUR-2026-104",
          date: new Date().toISOString().split("T")[0],
          party_name: "BHARAT YARN DISTRIBUTORS",
          amount: 5200000,
          status: "POSTED",
        },
        {
          id: "tx-03",
          voucher_type: "Receipt",
          voucher_number: "RCP-2026-042",
          date: new Date().toISOString().split("T")[0],
          party_name: "MURUGAN KNITTING MILLS",
          amount: 2500000,
          status: "POSTED",
        },
      ],
    };
  },

  getTrialBalance: async (companyId: string): Promise<TrialBalanceEntry[]> => {
    if (isTauriEnvironment()) {
      return invoke<TrialBalanceEntry[]>("get_trial_balance", { companyId });
    }
    return [
      {
        account_id: "acc-1001",
        account_name: "Cash in Hand",
        account_type: "Asset",
        debit_total: 4500000,
        credit_total: 1200000,
        net_balance: 3300000,
      },
      {
        account_id: "acc-1002",
        account_name: "State Bank of India (Current A/c)",
        account_type: "Asset",
        debit_total: 12500000,
        credit_total: 4500000,
        net_balance: 8000000,
      },
      {
        account_id: "acc-1005",
        account_name: "Sundry Debtors (Customers)",
        account_type: "Asset",
        debit_total: 22750000,
        credit_total: 0,
        net_balance: 22750000,
      },
      {
        account_id: "acc-2001",
        account_name: "Sundry Creditors (Suppliers)",
        account_type: "Liability",
        debit_total: 0,
        credit_total: 4200000,
        net_balance: -4200000,
      },
      {
        account_id: "acc-2002",
        account_name: "GST Output Tax Payable",
        account_type: "Liability",
        debit_total: 0,
        credit_total: 3850000,
        net_balance: -3850000,
      },
      {
        account_id: "acc-4001",
        account_name: "Sales Revenue",
        account_type: "Income",
        debit_total: 0,
        credit_total: 34500000,
        net_balance: -34500000,
      },
      {
        account_id: "acc-5001",
        account_name: "Purchase Account",
        account_type: "Expense",
        debit_total: 21500000,
        credit_total: 0,
        net_balance: 21500000,
      },
    ];
  },

  // User Management & RBAC
  loginUser: async (input: { username: string; password: string }): Promise<LoginResult> => {
    if (isTauriEnvironment()) {
      return invoke<LoginResult>("login_user", { input });
    }
    if (input.username === "admin" && input.password === "admin123") {
      const mockUser: User = {
        id: "usr-admin",
        username: "admin",
        display_name: "System Administrator",
        role_id: "ADMIN",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      };
      return { success: true, user: mockUser, message: "Login successful" };
    }
    return { success: false, message: "Invalid credentials" };
  },

  listUsers: async (): Promise<User[]> => {
    if (isTauriEnvironment()) {
      return invoke<User[]>("list_users");
    }
    return [
      {
        id: "usr-admin",
        username: "admin",
        display_name: "System Administrator",
        role_id: "ADMIN",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  },

  getUserCounts: async (): Promise<UserCounts> => {
    if (isTauriEnvironment()) {
      return invoke<UserCounts>("get_user_counts");
    }
    return { total_users: 1, active_users: 1, inactive_users: 0 };
  },

  createUser: async (
    actorUserId: string | null,
    actorName: string | null,
    input: CreateUserInput
  ): Promise<User> => {
    if (isTauriEnvironment()) {
      return invoke<User>("create_user", {
        actorUserId,
        actorName,
        input,
      });
    }
    return {
      id: `usr-${Date.now()}`,
      username: input.username,
      display_name: input.display_name,
      role_id: input.role_id,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  updateUserStatus: async (
    actorUserId: string | null,
    actorName: string | null,
    userId: string,
    isActive: boolean
  ): Promise<void> => {
    if (isTauriEnvironment()) {
      return invoke<void>("update_user_status", {
        actorUserId,
        actorName,
        userId,
        isActive,
      });
    }
  },

  resetUserPassword: async (
    actorUserId: string | null,
    actorName: string | null,
    userId: string,
    newPassword: string
  ): Promise<void> => {
    if (isTauriEnvironment()) {
      return invoke<void>("reset_user_password", {
        actorUserId,
        actorName,
        userId,
        newPassword,
      });
    }
  },

  // Audit Logs & Print Audit
  listAuditLogs: async (limit = 50): Promise<AuditLog[]> => {
    if (isTauriEnvironment()) {
      return invoke<AuditLog[]>("list_audit_logs", { limit });
    }
    return [];
  },

  recordPrintAudit: async (input: RecordPrintInput): Promise<string> => {
    if (isTauriEnvironment()) {
      return invoke<string>("record_print_audit", { input });
    }
    return `audit-print-${Date.now()}`;
  },

  listPrintAudits: async (limit = 50): Promise<InvoicePrintAudit[]> => {
    if (isTauriEnvironment()) {
      return invoke<InvoicePrintAudit[]>("list_print_audits", { limit });
    }
    return [];
  },
};

