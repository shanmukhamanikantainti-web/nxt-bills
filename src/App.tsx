import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  Receipt, 
  ShoppingBag, 
  Package, 
  Users, 
  Truck, 
  BookOpen, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  Trash2,
  Printer,
  Eye,
  Save,
  X,
  FileSpreadsheet,
  UploadCloud,
  Settings,
  Search,
  FileText,
  Clock,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  FolderOpen,
  UserCheck,
  Key,
  Lock,
  History,
  FileCheck2,
  LogOut,
  UserPlus
} from 'lucide-react';
import { 
  api, 
  Company, 
  Customer, 
  Supplier, 
  Product, 
  DashboardMetrics, 
  TrialBalanceEntry, 
  StorageInfo, 
  formatCurrency, 
  ImportSummaryReport, 
  ValidationResult,
  User,
  UserCounts,
  AuditLog,
  InvoicePrintAudit
} from './services/api';
import { 
  InvoicePrintDocument, 
  InvoicePrintData, 
  InvoiceItemLine, 
  numberToIndianWords 
} from './components/InvoicePrint';

interface BillItemRow {
  productId: string;
  productName: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number; // in rupees
  cgstRate: number; // percentage, e.g. 2.5
  sgstRate: number; // percentage, e.g. 2.5
  igstRate: number; // percentage, e.g. 0
}

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers' | 'ledger' | 'transfer' | 'legacy' | 'settings' | 'business_profile' | 'users' | 'audits' | 'print_audits'
  >('dashboard');

  // Authentication & RBAC state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [userCounts, setUserCounts] = useState<UserCounts>({ total_users: 1, active_users: 1, inactive_users: 0 });
  const [usersList, setUsersList] = useState<User[]>([]);
  const [auditList, setAuditList] = useState<AuditLog[]>([]);
  const [printAuditList, setPrintAuditList] = useState<InvoicePrintAudit[]>([]);

  // User Management Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('BILLING_OPERATOR');
  const [passwordResetModalUser, setPasswordResetModalUser] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Core accounting entities
  const [company, setCompany] = useState<Company | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  // -------------------------------------------------------------
  // SALES VOUCHER STATE
  // -------------------------------------------------------------
  const [invoiceNo, setInvoiceNo] = useState('INV/2026-27/000001');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank' | 'Credit'>('Credit');
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  const [employeeName, setEmployeeName] = useState('Staff');
  const [ackNo, setAckNo] = useState('');
  const [ackDate, setAckDate] = useState('');
  const [irnNo, setIrnNo] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [narration, setNarration] = useState('');

  // Items in current invoice
  const [billItems, setBillItems] = useState<BillItemRow[]>([
    {
      productId: '',
      productName: '',
      hsnSac: '52051210',
      quantity: 1,
      unit: 'KGS',
      rate: 310,
      cgstRate: 2.5,
      sgstRate: 2.5,
      igstRate: 0,
    }
  ]);

  // -------------------------------------------------------------
  // PRINT PREVIEW MODAL STATE
  // -------------------------------------------------------------
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printZoom, setPrintZoom] = useState<number>(0.95);
  const [previewInvoiceData, setPreviewInvoiceData] = useState<InvoicePrintData | null>(null);

  // -------------------------------------------------------------
  // QUICK MASTER CREATION MODAL (Alt+C)
  // -------------------------------------------------------------
  const [showQuickMasterModal, setShowQuickMasterModal] = useState(false);
  const [quickMasterType, setQuickMasterType] = useState<'customer' | 'product'>('customer');
  
  // Quick Customer Form
  const [qcName, setQcName] = useState('');
  const [qcGstin, setQcGstin] = useState('');
  const [qcPhone, setQcPhone] = useState('');
  const [qcCity, setQcCity] = useState('Tiruppur');
  const [qcState, setQcState] = useState('Tamil Nadu');
  const [qcStateCode, setQcStateCode] = useState('33');
  const [qcAddress, setQcAddress] = useState('');

  // Quick Product Form
  const [qpName, setQpName] = useState('');
  const [qpCode, setQpCode] = useState('');
  const [qpHsn, setQpHsn] = useState('52051210');
  const [qpUnit, setQpUnit] = useState('KGS');
  const [qpBuyRate, setQpBuyRate] = useState('260');
  const [qpSellRate, setQpSellRate] = useState('310');
  const [qpGstRate, setQpGstRate] = useState('5');
  const [qpOpeningStock, setQpOpeningStock] = useState('100');

  // -------------------------------------------------------------
  // BUSINESS PROFILE / SETTINGS FORM STATE
  // -------------------------------------------------------------
  const [bpName, setBpName] = useState('');
  const [bpTradeName, setBpTradeName] = useState('');
  const [bpGstin, setBpGstin] = useState('');
  const [bpPan, setBpPan] = useState('');
  const [bpAddress1, setBpAddress1] = useState('');
  const [bpAddress2, setBpAddress2] = useState('');
  const [bpCity, setBpCity] = useState('');
  const [bpState, setBpState] = useState('');
  const [bpStateCode, setBpStateCode] = useState('');
  const [bpPin, setBpPin] = useState('');
  const [bpPhone, setBpPhone] = useState('');
  const [bpEmail, setBpEmail] = useState('');
  const [bpWebsite, setBpWebsite] = useState('');
  const [bpBankName, setBpBankName] = useState('');
  const [bpBankBranch, setBpBankBranch] = useState('');
  const [bpBankAccNo, setBpBankAccNo] = useState('');
  const [bpBankIfsc, setBpBankIfsc] = useState('');
  const [bpBankUpi, setBpBankUpi] = useState('');
  const [bpPrefix, setBpPrefix] = useState('DA');

  // Transfer & Legacy states
  const [exportDestPath, setExportDestPath] = useState('E:\\');
  const [importSrcPath, setImportSrcPath] = useState('E:\\SDL_ACC');
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [packageValidation, setPackageValidation] = useState<ValidationResult | null>(null);
  const [legacyText, setLegacyText] = useState(`[
  {
    "type": "customer",
    "name": "Murugan Textiles",
    "code": "CUST-301",
    "phone": "9842100000",
    "opening_balance": 150000
  },
  {
    "type": "product",
    "name": "Poly-Cotton Blended Yarn 40s",
    "code": "YRN-PC-40",
    "purchase_price": 28000,
    "selling_price": 34000,
    "opening_stock": 250,
    "tax_rate_bps": 500
  }
]`);
  const [legacyReport, setLegacyReport] = useState<ImportSummaryReport | null>(null);
  const [importingLegacy, setImportingLegacy] = useState(false);

  // Form input refs for keyboard shortcuts
  const dateInputRef = useRef<HTMLInputElement>(null);
  const customerSelectRef = useRef<HTMLSelectElement>(null);
  const productSelectRef = useRef<HTMLSelectElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Clock ticker
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid shortcuts if typing in a text area or specific input unless function keys
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      // Alt+C : Create master
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setShowQuickMasterModal(true);
        return;
      }

      // Alt+L : Ledgers
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setActiveTab('ledger');
        return;
      }

      // Alt+I : Inventory
      if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        setActiveTab('inventory');
        return;
      }

      // F2 : Change date
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('sales');
        dateInputRef.current?.focus();
        return;
      }

      // F4 : Customer selection
      if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('sales');
        customerSelectRef.current?.focus();
        return;
      }

      // F5 : Sales voucher
      if (e.key === 'F5') {
        e.preventDefault();
        setActiveTab('sales');
        return;
      }

      // F6 : Product selection
      if (e.key === 'F6') {
        e.preventDefault();
        setActiveTab('sales');
        productSelectRef.current?.focus();
        return;
      }

      // F7 : Quantity
      if (e.key === 'F7') {
        e.preventDefault();
        setActiveTab('sales');
        qtyInputRef.current?.focus();
        return;
      }

      // F8 : Cycle payment mode
      if (e.key === 'F8') {
        e.preventDefault();
        setPaymentMode(prev => {
          if (prev === 'Credit') return 'Cash';
          if (prev === 'Cash') return 'UPI';
          if (prev === 'UPI') return 'Bank';
          return 'Credit';
        });
        return;
      }

      // Ctrl+S : Save invoice
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveInvoice(false);
        return;
      }

      // Ctrl+Shift+P : Print Preview
      if (e.ctrlKey && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleOpenPrintPreview();
        return;
      }

      // Ctrl+P : Save & Print
      if (e.ctrlKey && !e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handleSaveInvoice(true);
        return;
      }

      // Esc : Close modal
      if (e.key === 'Escape') {
        if (showPrintModal) {
          setShowPrintModal(false);
        } else if (showQuickMasterModal) {
          setShowQuickMasterModal(false);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPrintModal, showQuickMasterModal, billItems, selectedCustomerId, paymentMode, company, customers, products]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setStatusMsg(msg);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const stor = await api.getStorageStatus();
      setStorage(stor);

      const comp = await api.getCompany();
      if (comp) {
        setCompany(comp);
        populateCompanyFields(comp);
        await refreshCompanyData(comp.id);
      }
    } catch (e: any) {
      console.error(e);
      showNotification(`Initialization failed: ${e.toString()}`, true);
    } finally {
      setLoading(false);
    }
  };

  const populateCompanyFields = (comp: Company) => {
    setBpName(comp.name || '');
    setBpTradeName(comp.trade_name || comp.name || '');
    setBpGstin(comp.tax_number || '');
    setBpPan(comp.pan || '');
    setBpAddress1(comp.address_line1 || '');
    setBpAddress2(comp.address_line2 || '');
    setBpCity(comp.city || '');
    setBpState(comp.state || '');
    setBpStateCode(comp.state_code || '33');
    setBpPin(comp.postal_code || '');
    setBpPhone(comp.phone || '');
    setBpEmail(comp.email || '');
    setBpWebsite(comp.website || '');
    setBpBankName(comp.bank_name || '');
    setBpBankBranch(comp.bank_branch || '');
    setBpBankAccNo(comp.bank_account_no || '');
    setBpBankIfsc(comp.bank_ifsc || '');
    setBpBankUpi(comp.bank_upi_id || '');
    setBpPrefix(comp.invoice_prefix || 'DA');
  };

  const refreshCompanyData = async (compId: string) => {
    try {
      const [m, c, s, p, tb, uc, ulist, audits, pAudits] = await Promise.all([
        api.getDashboardMetrics(compId),
        api.listCustomers(compId),
        api.listSuppliers(compId),
        api.listProducts(compId),
        api.getTrialBalance(compId),
        api.getUserCounts(),
        api.listUsers(),
        api.listAuditLogs(30),
        api.listPrintAudits(30)
      ]);
      setMetrics(m);
      setCustomers(c);
      setSuppliers(s);
      setProducts(p);
      setTrialBalance(tb);
      setUserCounts(uc);
      setUsersList(ulist);
      setAuditList(audits);
      setPrintAuditList(pAudits);

      // Auto-select first customer if none selected
      if (c.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(c[0].id);
        if (c[0].shipping_address) setShippingAddress(c[0].shipping_address);
      }

      // Populate first bill item with first product if empty
      if (p.length > 0 && billItems.length === 1 && !billItems[0].productId) {
        const firstProd = p[0];
        setBillItems([{
          productId: firstProd.id,
          productName: firstProd.name,
          hsnSac: firstProd.hsn_code || '52051210',
          quantity: 1,
          unit: firstProd.unit || 'KGS',
          rate: firstProd.selling_price / 100,
          cgstRate: (firstProd.tax_rate_bps / 100) / 2,
          sgstRate: (firstProd.tax_rate_bps / 100) / 2,
          igstRate: 0,
        }]);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // CALCULATION LOGIC FOR SALES INVOICE
  // -------------------------------------------------------------
  const calculateTotals = () => {
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    billItems.forEach(item => {
      const lineTaxable = (item.quantity || 0) * (item.rate || 0);
      const lineCgst = (lineTaxable * (item.cgstRate || 0)) / 100;
      const lineSgst = (lineTaxable * (item.sgstRate || 0)) / 100;
      const lineIgst = (lineTaxable * (item.igstRate || 0)) / 100;

      taxableTotal += lineTaxable;
      cgstTotal += lineCgst;
      sgstTotal += lineSgst;
      igstTotal += lineIgst;
    });

    const unroundedGrandTotal = taxableTotal + cgstTotal + sgstTotal + igstTotal;
    const roundedGrandTotal = Math.round(unroundedGrandTotal);
    const roundOff = roundedGrandTotal - unroundedGrandTotal;

    return {
      taxableTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      roundOff,
      grandTotal: roundedGrandTotal,
      amountInWords: numberToIndianWords(roundedGrandTotal),
    };
  };

  const totals = calculateTotals();

  // Handle customer change
  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find(c => c.id === custId);
    if (cust) {
      if (cust.shipping_address) {
        setShippingAddress(cust.shipping_address);
      } else if (cust.billing_address) {
        setShippingAddress(cust.billing_address);
      } else if (cust.address) {
        setShippingAddress(`${cust.address}, ${cust.city || ''}`);
      }
      if (cust.state_code && cust.state) {
        setPlaceOfSupply(`${cust.state_code}-${cust.state}`);
      }
    }
  };

  // Handle item row changes
  const handleItemProductSelect = (index: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;

    setBillItems(prev => {
      const copy = [...prev];
      const isInterState = placeOfSupply && !placeOfSupply.startsWith('33');
      const totalTaxPercent = prod.tax_rate_bps / 100;

      copy[index] = {
        ...copy[index],
        productId: prod.id,
        productName: prod.name,
        hsnSac: prod.hsn_code || '52051210',
        unit: prod.unit || 'KGS',
        rate: prod.selling_price / 100,
        cgstRate: isInterState ? 0 : totalTaxPercent / 2,
        sgstRate: isInterState ? 0 : totalTaxPercent / 2,
        igstRate: isInterState ? totalTaxPercent : 0,
      };
      return copy;
    });
  };

  const handleUpdateItemField = (index: number, field: keyof BillItemRow, value: any) => {
    setBillItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value
      };
      return copy;
    });
  };

  const handleAddItemRow = () => {
    setBillItems(prev => [
      ...prev,
      {
        productId: '',
        productName: '',
        hsnSac: '52051210',
        quantity: 1,
        unit: 'KGS',
        rate: 0,
        cgstRate: 2.5,
        sgstRate: 2.5,
        igstRate: 0,
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (billItems.length <= 1) {
      showNotification('At least one item line is required', true);
      return;
    }
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  // Build Invoice DTO for print document
  const buildInvoicePrintData = (): InvoicePrintData => {
    const cust = customers.find(c => c.id === selectedCustomerId);
    const itemLines: InvoiceItemLine[] = billItems.map((item, idx) => {
      const lineTaxable = item.quantity * item.rate;
      const cgstAmt = (lineTaxable * item.cgstRate) / 100;
      const sgstAmt = (lineTaxable * item.sgstRate) / 100;
      const igstAmt = (lineTaxable * item.igstRate) / 100;
      const lineTotal = lineTaxable + cgstAmt + sgstAmt + igstAmt;

      return {
        serialNo: idx + 1,
        productName: item.productName || 'Yarn / Fabric Goods',
        hsnSac: item.hsnSac || '52051210',
        quantity: item.quantity,
        rate: item.rate,
        cgstRate: item.cgstRate,
        cgstAmount: cgstAmt,
        sgstRate: item.sgstRate,
        sgstAmount: sgstAmt,
        igstRate: item.igstRate,
        igstAmount: igstAmt,
        total: lineTotal,
      };
    });

    return {
      invoiceNumber: invoiceNo,
      invoiceDate: invoiceDate,
      ackNumber: ackNo,
      ackDate: ackDate,
      irnNumber: irnNo,
      paymentMode: paymentMode,
      employeeName: employeeName,
      company: {
        legalName: company?.name || 'BLACK PEAK STUDIO',
        tradeName: company?.trade_name || company?.name || 'BLACK PEAK STUDIO',
        gstin: company?.tax_number || '',
        pan: company?.pan || '',
        addressLine1: company?.address_line1 || '',
        addressLine2: company?.address_line2 || '',
        city: company?.city || '',
        state: company?.state || '',
        stateCode: company?.state_code || '',
        postalCode: company?.postal_code || '',
        phone: company?.phone || '',
        email: company?.email || '',
        website: company?.website || '',
        accentColor: company?.accent_color || '#102A43',
      },
      customer: {
        name: cust?.name || 'CASH SALE CUSTOMER',
        address: cust?.address || 'Tiruppur',
        city: cust?.city || 'Tiruppur',
        state: cust?.state || 'Tamil Nadu',
        stateCode: cust?.state_code || '33',
        gstin: cust?.tax_number || 'URP',
        phone: cust?.phone || '',
        shippingAddress: shippingAddress || cust?.shipping_address || cust?.billing_address || cust?.address || 'Tiruppur',
      },
      items: itemLines,
      subtotal: totals.taxableTotal,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      amountInWords: totals.amountInWords,
    };
  };

  // Open Print Preview Modal
  const handleOpenPrintPreview = () => {
    const data = buildInvoicePrintData();
    setPreviewInvoiceData(data);
    setShowPrintModal(true);
  };

  // Save Sales Invoice
  const handleSaveInvoice = async (andPrint = false) => {
    if (!company) {
      showNotification('Company profile not initialized', true);
      return;
    }
    const validItems = billItems.filter(i => i.productId && i.quantity > 0 && i.rate > 0);
    if (validItems.length === 0) {
      showNotification('Please add at least one valid product item with quantity and rate', true);
      return;
    }

    try {
      const saleInput = {
        company_id: company.id,
        customer_id: selectedCustomerId || undefined,
        invoice_date: invoiceDate,
        payment_mode: paymentMode,
        notes: narration || `Sales Invoice ${invoiceNo}`,
        items: validItems.map(i => ({
          product_id: i.productId,
          quantity: i.quantity,
          rate: Math.round(i.rate * 100), // convert to paise
          discount: 0,
          tax_rate_bps: Math.round((i.cgstRate + i.sgstRate + i.igstRate) * 100),
        })),
      };

      const postedInvoiceNo = await api.postSale(saleInput);
      showNotification(`Invoice ${postedInvoiceNo} posted successfully! Inventory and ledgers updated.`);

      if (andPrint) {
        const data = buildInvoicePrintData();
        data.invoiceNumber = postedInvoiceNo;
        setPreviewInvoiceData(data);
        setShowPrintModal(true);
      }

      await refreshCompanyData(company.id);

      // Increment local invoice number
      const parts = invoiceNo.split('/');
      if (parts.length === 3) {
        const nextNum = String(parseInt(parts[2]) + 1).padStart(6, '0');
        setInvoiceNo(`${parts[0]}/${parts[1]}/${nextNum}`);
      }
    } catch (e: any) {
      showNotification(`Failed to post invoice: ${e.toString()}`, true);
    }
  };

  // Quick Master Save
  const handleSaveQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !qcName) return;
    try {
      const newCust = await api.createCustomer({
        id: '',
        company_id: company.id,
        ledger_account_id: '',
        name: qcName,
        trade_name: qcName,
        code: `CUST-${Date.now().toString().slice(-4)}`,
        phone: qcPhone,
        address: qcAddress,
        city: qcCity,
        state: qcState,
        state_code: qcStateCode,
        tax_number: qcGstin,
        credit_limit: 10000000,
        opening_balance: 0,
        current_balance: 0,
        is_active: true,
        created_at: '',
      });
      showNotification(`Customer '${newCust.name}' created!`);
      setShowQuickMasterModal(false);
      await refreshCompanyData(company.id);
      setSelectedCustomerId(newCust.id);
      setQcName('');
      setQcGstin('');
      setQcPhone('');
    } catch (e: any) {
      showNotification(`Failed to create customer: ${e.toString()}`, true);
    }
  };

  const handleSaveQuickProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !qpName) return;
    try {
      const buyPaise = Math.round(parseFloat(qpBuyRate) * 100);
      const sellPaise = Math.round(parseFloat(qpSellRate) * 100);
      const taxBps = Math.round(parseFloat(qpGstRate) * 100);
      const opening = parseFloat(qpOpeningStock) || 0;

      const newProd = await api.createProduct({
        id: '',
        company_id: company.id,
        name: qpName,
        code: qpCode || `PRD-${Date.now().toString().slice(-4)}`,
        hsn_code: qpHsn,
        unit: qpUnit,
        purchase_price: buyPaise,
        selling_price: sellPaise,
        tax_rate_bps: taxBps,
        current_stock: 0,
        reorder_level: 10,
        is_active: true,
        created_at: '',
      }, opening);

      showNotification(`Product '${newProd.name}' created!`);
      setShowQuickMasterModal(false);
      await refreshCompanyData(company.id);
      
      // Auto select in current bill item if empty
      setBillItems(prev => {
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        if (!copy[lastIdx].productId) {
          copy[lastIdx] = {
            ...copy[lastIdx],
            productId: newProd.id,
            productName: newProd.name,
            hsnSac: newProd.hsn_code || '52051210',
            unit: newProd.unit || 'KGS',
            rate: newProd.selling_price / 100,
            cgstRate: (newProd.tax_rate_bps / 100) / 2,
            sgstRate: (newProd.tax_rate_bps / 100) / 2,
            igstRate: 0,
          };
        }
        return copy;
      });

      setQpName('');
      setQpCode('');
    } catch (e: any) {
      showNotification(`Failed to create product: ${e.toString()}`, true);
    }
  };

  // Save Business Profile
  const handleSaveBusinessProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    try {
      const updated = await api.saveCompany({
        ...company,
        name: bpName,
        trade_name: bpTradeName,
        tax_number: bpGstin,
        pan: bpPan,
        address_line1: bpAddress1,
        address_line2: bpAddress2,
        city: bpCity,
        state: bpState,
        state_code: bpStateCode,
        postal_code: bpPin,
        phone: bpPhone,
        email: bpEmail,
        website: bpWebsite,
        bank_name: bpBankName,
        bank_branch: bpBankBranch,
        bank_account_no: bpBankAccNo,
        bank_ifsc: bpBankIfsc,
        bank_upi_id: bpBankUpi,
        invoice_prefix: bpPrefix,
      });
      setCompany(updated);
      showNotification('Business profile updated successfully');
    } catch (e: any) {
      showNotification(`Profile save error: ${e.toString()}`, true);
    }
  };

  // User Management Handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newDisplayName) {
      showNotification('Please fill in username, display name, and password', true);
      return;
    }
    try {
      const created = await api.createUser({
        username: newUsername,
        display_name: newDisplayName,
        password: newPassword,
        role: newRole,
      });
      showNotification(`User '${created.username}' created successfully.`);
      setShowAddUserModal(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewPassword('');
      setNewRole('BILLING_OPERATOR');
      if (company?.id) await refreshCompanyData(company.id);
    } catch (e: any) {
      showNotification(`Failed to create user: ${e.toString()}`, true);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    if (user.username === 'admin' && user.is_active) {
      showNotification('Primary administrator cannot be deactivated', true);
      return;
    }
    try {
      await api.updateUserStatus(user.id, !user.is_active);
      showNotification(`User '${user.username}' is now ${!user.is_active ? 'Active' : 'Inactive'}.`);
      if (company?.id) await refreshCompanyData(company.id);
    } catch (e: any) {
      showNotification(`Failed to update status: ${e.toString()}`, true);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordResetModalUser || !resetNewPassword) return;
    try {
      await api.resetUserPassword(passwordResetModalUser.id, resetNewPassword);
      showNotification(`Password for '${passwordResetModalUser.username}' has been updated.`);
      setPasswordResetModalUser(null);
      setResetNewPassword('');
      if (company?.id) await refreshCompanyData(company.id);
    } catch (e: any) {
      showNotification(`Password reset failed: ${e.toString()}`, true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await api.loginUser({
        username: loginUsername,
        password: loginPassword,
      });
      if (res.success && res.user) {
        setCurrentUser(res.user);
        showNotification(`Welcome, ${res.user.display_name}!`);
        if (company?.id) await refreshCompanyData(company.id);
      } else {
        setLoginError(res.message);
      }
    } catch (e: any) {
      setLoginError(e.toString());
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginPassword('');
    showNotification('Logged out successfully.');
  };

  // Backup & Eject
  const handleBackup = async () => {
    try {
      const path = await api.backupDatabase();
      showNotification(`Verified atomic backup created at: ${path}`);
    } catch (e: any) {
      showNotification(`Backup failed: ${e.toString()}`, true);
    }
  };

  const handleSafeEject = async () => {
    try {
      const res = await api.safeEject();
      showNotification(res);
      const stor = await api.getStorageStatus();
      setStorage(stor);
    } catch (e: any) {
      showNotification(`Safe eject error: ${e.toString()}`, true);
    }
  };

  // USB Transfer Package Export
  const handleExportPackage = async () => {
    if (!exportDestPath) return;
    setExportProgress('Preparing database, flushing WAL, and generating checksums...');
    try {
      const res = await api.exportTransferPackage(exportDestPath);
      setExportProgress(null);
      showNotification(`Export Success: Package created at ${res.export_path}`);
    } catch (e: any) {
      setExportProgress(null);
      showNotification(`Export Failed: ${e.toString()}`, true);
    }
  };

  // Validate Transfer Package
  const handleValidatePackage = async () => {
    if (!importSrcPath) return;
    setImportProgress('Validating package structure and PRAGMA integrity...');
    try {
      const res = await api.validateTransferPackage(importSrcPath);
      setPackageValidation(res);
      setImportProgress(null);
      if (res.is_valid) {
        showNotification('Package integrity check passed! Ready for safe import.');
      } else {
        showNotification(`Validation issues detected: ${res.errors.join(', ')}`, true);
      }
    } catch (e: any) {
      setImportProgress(null);
      showNotification(`Validation failed: ${e.toString()}`, true);
    }
  };

  // Import Transfer Package
  const handleImportPackage = async () => {
    if (!importSrcPath) return;
    setImportProgress('Creating safety backup and importing portable database...');
    try {
      const res = await api.importTransferPackage(importSrcPath);
      setImportProgress(null);
      showNotification(`Package imported! Safety backup saved at: ${res.safety_backup_path || 'local backups'}`);
      await loadInitialData();
    } catch (e: any) {
      setImportProgress(null);
      showNotification(`Import failed: ${e.toString()}`, true);
    }
  };

  // Legacy Data Import
  const handleExecuteLegacyImport = async () => {
    if (!company) return;
    setImportingLegacy(true);
    try {
      const parsed = JSON.parse(legacyText);
      if (!Array.isArray(parsed)) throw new Error('Input must be a JSON array of records');

      const customers = parsed.filter(r => r.type === 'customer');
      const suppliers = parsed.filter(r => r.type === 'supplier');
      const products = parsed.filter(r => r.type === 'product');

      const report = await api.importLegacyData({
        company_id: company.id,
        customers,
        suppliers,
        products,
      });

      setLegacyReport(report);
      showNotification(`Legacy Import: ${report.imported_successfully} records ingested, ${report.rejected_count} rejected`);
      await refreshCompanyData(company.id);
    } catch (e: any) {
      showNotification(`Legacy Import Error: ${e.toString()}`, true);
    } finally {
      setImportingLegacy(false);
    }
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. ON-SCREEN APPLICATION UI (Hidden completely during print)  */}
      {/* ============================================================== */}
      <div className="flex flex-col h-screen w-screen bg-[#F4F5F7] text-[#1F2933] select-none font-sans overflow-hidden no-print">
      
      {/* ============================================================== */}
      {/* 1. TOP WINDOW BAR: TRADITIONAL ACCOUNTING APPLICATION SHELL    */}
      {/* ============================================================== */}
      <header className="h-9 bg-[#102A43] text-white flex items-center justify-between px-3 border-b border-[#0B1E30] shrink-0 text-xs shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-bold tracking-wider text-amber-300">
            <img src="/logo.png" alt="NXT-BILLS Logo" className="w-5 h-5 rounded object-contain shadow-sm border border-amber-400/30" />
            <span>NXT-BILLS</span>
          </div>
          <span className="text-slate-400">|</span>
          <div className="font-semibold text-slate-100 flex items-center space-x-2">
            <span>Company:</span>
            <span className="text-white uppercase font-bold tracking-wide">
              {company?.name || 'BLACK PEAK STUDIO'}
            </span>
          </div>
          <span className="text-slate-400">|</span>
          <div className="text-slate-200">
            FY: <span className="font-bold text-amber-300">2026-27</span>
          </div>
        </div>

        {/* Global Keyboard Shortcut Badges */}
        <div className="hidden lg:flex items-center space-x-1.5 text-[11px] font-mono text-slate-300">
          <span className="bg-[#1E3A8A] px-1.5 py-0.5 rounded text-white font-semibold">F2 Date</span>
          <span className="bg-[#1E3A8A] px-1.5 py-0.5 rounded text-white font-semibold">F4 Cust</span>
          <span className="bg-[#1E3A8A] px-1.5 py-0.5 rounded text-white font-semibold">F5 Sales</span>
          <span className="bg-[#1E3A8A] px-1.5 py-0.5 rounded text-white font-semibold">F6 Prod</span>
          <span className="bg-[#1E3A8A] px-1.5 py-0.5 rounded text-white font-semibold">F8 Pay</span>
          <span className="bg-[#0E6251] px-1.5 py-0.5 rounded text-white font-semibold">Alt+C Master</span>
          <span className="bg-[#D4121C] px-1.5 py-0.5 rounded text-white font-semibold">Ctrl+P Print</span>
        </div>

        {/* Clock & Status */}
        <div className="flex items-center space-x-3 text-[11.5px] text-slate-200">
          <span className="flex items-center space-x-1 font-mono text-slate-100">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime}</span>
          </span>
          <span className="text-slate-400">|</span>
          <div className="flex items-center space-x-1.5">
            <span className="bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center space-x-1">
              <UserCheck className="w-3 h-3 inline mr-0.5" />
              <span>{currentUser?.display_name || 'Administrator'}</span>
            </span>
            <button
              onClick={() => setActiveTab('users')}
              className="text-slate-300 hover:text-amber-300 text-[10px] underline"
              title="User Management"
            >
              Users ({userCounts.active_users})
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* NOTIFICATIONS BANNER                                           */}
      {/* ============================================================== */}
      {statusMsg && (
        <div className="bg-emerald-700 text-white px-3 py-1 text-xs font-medium flex items-center justify-between shadow-inner shrink-0">
          <span className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{statusMsg}</span>
          </span>
          <button onClick={() => setStatusMsg(null)} className="text-white hover:text-slate-200 text-xs">✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="bg-rose-700 text-white px-3 py-1 text-xs font-medium flex items-center justify-between shadow-inner shrink-0">
          <span className="flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-white hover:text-slate-200 text-xs">✕</button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. BODY SPLIT: ACCOUNTING MENU (LEFT) + WORK AREA (RIGHT)      */}
      {/* ============================================================== */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* COMPACT LEFT ACCOUNTING MENU */}
        <nav className="w-56 bg-[#FFFFFF] border-r border-[#C8CDD3] flex flex-col justify-between shrink-0 overflow-y-auto select-none shadow-sm">
          <div className="py-2 text-[12px]">
            <div className="px-3 py-1.5 text-[10px] font-bold text-[#5B6573] uppercase tracking-wider border-b border-[#E2E8F0] mb-1 flex items-center space-x-1.5">
              <img src="/logo.png" alt="Logo" className="w-3.5 h-3.5 rounded object-contain" />
              <span>Gateway of NXT-BILLS</span>
            </div>

            {/* Menu Sections */}
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'dashboard' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard Overview</span>
              </button>

              <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold text-[#829AB1] uppercase tracking-wider">
                Transactions (Vouchers)
              </div>
              <button
                onClick={() => setActiveTab('sales')}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between font-medium ${
                  activeTab === 'sales' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <Receipt className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sales Invoice</span>
                </span>
                <span className="text-[10px] px-1 bg-slate-200 text-slate-700 rounded font-mono">F5</span>
              </button>
              <button
                onClick={() => setActiveTab('purchases')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'purchases' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                <span>Purchase Invoice</span>
              </button>

              <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold text-[#829AB1] uppercase tracking-wider">
                Masters
              </div>
              <button
                onClick={() => setActiveTab('customers')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'customers' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Customers</span>
              </button>
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'suppliers' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-purple-600" />
                <span>Suppliers</span>
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'inventory' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>Products & Stock</span>
              </button>

              <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold text-[#829AB1] uppercase tracking-wider">
                Accounting & Reports
              </div>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'ledger' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                <span>Trial Balance & Ledgers</span>
              </button>

              <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold text-[#829AB1] uppercase tracking-wider">
                Users & Audit Logs
              </div>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-left px-3 py-1.5 flex items-center justify-between font-medium ${
                  activeTab === 'users' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>User Management</span>
                </span>
                <span className="text-[10px] px-1 bg-emerald-100 text-emerald-800 rounded font-mono font-bold">
                  {userCounts.active_users}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('print_audits')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'print_audits' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span>Invoice Print Activity</span>
              </button>
              <button
                onClick={() => setActiveTab('audits')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'audits' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <History className="w-3.5 h-3.5 text-slate-600" />
                <span>System Audit Logs</span>
              </button>

              <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold text-[#829AB1] uppercase tracking-wider">
                Utilities & Transfer
              </div>
              <button
                onClick={() => setActiveTab('transfer')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'transfer' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
                <span>USB Transfer Package</span>
              </button>
              <button
                onClick={() => setActiveTab('legacy')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'legacy' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                <span>Legacy Data Import</span>
              </button>

              <div className="px-3 pt-2 pb-0.5 text-[10px] font-bold text-[#829AB1] uppercase tracking-wider">
                Configuration
              </div>
              <button
                onClick={() => setActiveTab('business_profile')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'business_profile' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-slate-600" />
                <span>Business & Invoice Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-3 py-1.5 flex items-center space-x-2 font-medium ${
                  activeTab === 'settings' ? 'bg-[#102A43] text-white font-semibold' : 'text-[#1F2933] hover:bg-[#F0F4F8]'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-slate-600" />
                <span>Storage & Backup</span>
              </button>
            </div>
          </div>

          {/* Quick Action Footer in Sidebar */}
          <div className="p-2 border-t border-[#C8CDD3] bg-[#F8FAFC] space-y-1">
            <button
              onClick={() => {
                setQuickMasterType('customer');
                setShowQuickMasterModal(true);
              }}
              className="w-full bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#1F2933] px-2 py-1 text-[11px] font-medium border border-[#C8CDD3] flex items-center justify-center space-x-1"
            >
              <Plus className="w-3 h-3 text-indigo-700" />
              <span>New Customer (Alt+C)</span>
            </button>
            <button
              onClick={() => {
                setQuickMasterType('product');
                setShowQuickMasterModal(true);
              }}
              className="w-full bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#1F2933] px-2 py-1 text-[11px] font-medium border border-[#C8CDD3] flex items-center justify-center space-x-1"
            >
              <Plus className="w-3 h-3 text-emerald-700" />
              <span>New Product (Alt+C)</span>
            </button>
          </div>
        </nav>

        {/* WORK AREA (WHITE ACC-FIRST WORKSPACE) */}
        <main className="flex-1 bg-[#FFFFFF] overflow-y-auto flex flex-col">
          
          {/* ============================================================== */}
          {/* TAB 1: SALES INVOICE (VOUCHER ENTRY)                           */}
          {/* ============================================================== */}
          {activeTab === 'sales' && (
            <div className="p-4 flex-1 flex flex-col space-y-3">
              
              {/* Screen Header & Action Bar */}
              <div className="flex items-center justify-between border-b-2 border-[#102A43] pb-2">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] tracking-wide uppercase flex items-center space-x-2">
                    <span>Tax Invoice — Voucher Entry</span>
                    <span className="text-xs bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded font-mono font-normal">
                      Form No. GST INV-1
                    </span>
                  </h2>
                  <p className="text-[11px] text-[#5B6573]">
                    Accounting voucher mode. Taxes, stock, and ledger postings update automatically on save.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSaveInvoice(false)}
                    className="bg-[#102A43] hover:bg-[#1E3A8A] text-white px-3 py-1.5 text-xs font-semibold border border-[#0B1E30] flex items-center space-x-1.5 shadow-xs"
                    title="Ctrl+S"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>SAVE (Ctrl+S)</span>
                  </button>

                  <button
                    onClick={() => handleSaveInvoice(true)}
                    className="bg-[#D4121C] hover:bg-[#B50F18] text-white px-3 py-1.5 text-xs font-bold border border-[#900C12] flex items-center space-x-1.5 shadow-xs"
                    title="Ctrl+P"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>SAVE & PRINT (Ctrl+P)</span>
                  </button>

                  <button
                    onClick={handleOpenPrintPreview}
                    className="bg-[#FFFFFF] hover:bg-[#F0F4F8] text-[#1F2933] px-3 py-1.5 text-xs font-semibold border border-[#C8CDD3] flex items-center space-x-1.5"
                    title="Ctrl+Shift+P"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>PREVIEW</span>
                  </button>
                </div>
              </div>

              {/* VOUCHER HEADER FORM (DENSE) */}
              <div className="bg-[#F8FAFC] p-3 border border-[#C8CDD3] rounded-xs grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                
                {/* Invoice No */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                    Invoice No. <span className="text-blue-700">[AUTO]</span>
                  </label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    className="w-full font-mono font-bold text-[#102A43] bg-white"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                    Invoice Date <span className="text-blue-700">[F2]</span>
                  </label>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full font-mono"
                  />
                </div>

                {/* Customer */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#5B6573] uppercase">
                      Party Name (Customer) <span className="text-blue-700">[F4]</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickMasterType('customer');
                        setShowQuickMasterModal(true);
                      }}
                      className="text-[11px] text-blue-700 hover:underline font-bold"
                    >
                      + Create Party (Alt+C)
                    </button>
                  </div>
                  <select
                    ref={customerSelectRef}
                    value={selectedCustomerId}
                    onChange={e => handleCustomerChange(e.target.value)}
                    className="w-full font-semibold text-[#1F2933]"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.tax_number ? `(${c.tax_number})` : ''} — Bal: ₹{(c.current_balance/100).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Place of Supply */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                    Place of Supply
                  </label>
                  <input
                    type="text"
                    value={placeOfSupply}
                    onChange={e => setPlaceOfSupply(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                    Payment Mode <span className="text-blue-700">[F8]</span>
                  </label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    className="w-full font-bold text-[#102A43]"
                  >
                    <option value="Credit">Credit (Debit Customer A/c)</option>
                    <option value="Cash">Cash (Cash in Hand)</option>
                    <option value="UPI">UPI (Instant Bank Credit)</option>
                    <option value="Bank">Bank Transfer (NEFT/RTGS)</option>
                  </select>
                </div>

                {/* Shipping Address */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                    Dispatch / Shipping Destination
                  </label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Same as buyer address"
                    className="w-full"
                  />
                </div>
              </div>

              {/* ITEM ENTRY TABLE (DENSE TALLY STYLE) */}
              <div className="flex-1 flex flex-col border border-[#C8CDD3] bg-white overflow-hidden shadow-2xs">
                <div className="bg-[#E2E8F0] px-3 py-1.5 border-b border-[#C8CDD3] flex items-center justify-between text-xs font-bold text-[#102A43]">
                  <span>ITEM ENTRY SCHEDULE</span>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="text-[#5B6573]">Total Lines: {billItems.length}</span>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="bg-[#102A43] text-white hover:bg-[#1E3A8A] px-2 py-0.5 rounded text-[11px] font-semibold flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Row</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="acc-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }} className="text-center">S.No</th>
                        <th style={{ width: '320px' }}>Item Description (Product)</th>
                        <th style={{ width: '90px' }}>HSN/SAC</th>
                        <th style={{ width: '80px' }} className="num">Qty</th>
                        <th style={{ width: '60px' }}>Unit</th>
                        <th style={{ width: '100px' }} className="num">Rate (₹)</th>
                        <th style={{ width: '110px' }} className="num">Taxable (₹)</th>
                        <th style={{ width: '60px' }} className="num">CGST %</th>
                        <th style={{ width: '60px' }} className="num">SGST %</th>
                        <th style={{ width: '60px' }} className="num">IGST %</th>
                        <th style={{ width: '120px' }} className="num">Total (₹)</th>
                        <th style={{ width: '40px' }} className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems.map((item, idx) => {
                        const taxable = item.quantity * item.rate;
                        const cgstAmt = (taxable * item.cgstRate) / 100;
                        const sgstAmt = (taxable * item.sgstRate) / 100;
                        const igstAmt = (taxable * item.igstRate) / 100;
                        const lineTotal = taxable + cgstAmt + sgstAmt + igstAmt;

                        return (
                          <tr key={idx}>
                            <td className="text-center font-bold text-slate-500">{idx + 1}</td>
                            
                            {/* Product Selector */}
                            <td>
                              <select
                                ref={idx === 0 ? productSelectRef : undefined}
                                value={item.productId}
                                onChange={e => handleItemProductSelect(idx, e.target.value)}
                                className="w-full text-xs font-semibold py-1"
                              >
                                <option value="">-- Select Product --</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} [{p.hsn_code || 'HSN'}] (Stock: {p.current_stock})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* HSN/SAC */}
                            <td>
                              <input
                                type="text"
                                value={item.hsnSac}
                                onChange={e => handleUpdateItemField(idx, 'hsnSac', e.target.value)}
                                className="w-full text-xs font-mono py-1"
                              />
                            </td>

                            {/* Qty */}
                            <td>
                              <input
                                ref={idx === 0 ? qtyInputRef : undefined}
                                type="number"
                                min="0.1"
                                step="any"
                                value={item.quantity}
                                onChange={e => handleUpdateItemField(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-full text-xs text-right font-mono font-bold py-1"
                              />
                            </td>

                            {/* Unit */}
                            <td>
                              <input
                                type="text"
                                value={item.unit}
                                onChange={e => handleUpdateItemField(idx, 'unit', e.target.value)}
                                className="w-full text-xs text-center py-1 font-mono uppercase"
                              />
                            </td>

                            {/* Rate */}
                            <td>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.rate}
                                onChange={e => handleUpdateItemField(idx, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-full text-xs text-right font-mono py-1"
                              />
                            </td>

                            {/* Taxable */}
                            <td className="num font-semibold text-slate-800">
                              {taxable.toFixed(2)}
                            </td>

                            {/* CGST % */}
                            <td>
                              <input
                                type="number"
                                step="0.1"
                                value={item.cgstRate}
                                onChange={e => handleUpdateItemField(idx, 'cgstRate', parseFloat(e.target.value) || 0)}
                                className="w-full text-xs text-right font-mono py-1"
                              />
                            </td>

                            {/* SGST % */}
                            <td>
                              <input
                                type="number"
                                step="0.1"
                                value={item.sgstRate}
                                onChange={e => handleUpdateItemField(idx, 'sgstRate', parseFloat(e.target.value) || 0)}
                                className="w-full text-xs text-right font-mono py-1"
                              />
                            </td>

                            {/* IGST % */}
                            <td>
                              <input
                                type="number"
                                step="0.1"
                                value={item.igstRate}
                                onChange={e => handleUpdateItemField(idx, 'igstRate', parseFloat(e.target.value) || 0)}
                                className="w-full text-xs text-right font-mono py-1"
                              />
                            </td>

                            {/* Line Total */}
                            <td className="num font-bold text-[#102A43]">
                              {lineTotal.toFixed(2)}
                            </td>

                            {/* Action */}
                            <td className="text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                className="text-slate-400 hover:text-red-700 p-0.5"
                                title="Remove line"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-2 border-t border-[#C8CDD3] bg-[#F8FAFC] flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-blue-800 hover:text-blue-900 font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Next Product Item (Enter)</span>
                  </button>
                  <span className="text-[#5B6573]">
                    Pro Tip: Press <kbd className="px-1 py-0.5 bg-slate-200 rounded border border-slate-300 font-mono">Alt+C</kbd> anywhere to create missing items.
                  </span>
                </div>
              </div>

              {/* VOUCHER SUMMARY & TOTALS SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border border-[#C8CDD3] p-3 bg-[#F8FAFC] rounded-xs text-xs">
                
                {/* Notes & Amount in Words */}
                <div className="md:col-span-2 space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">
                      Amount In Words (Indian Numbering Format)
                    </label>
                    <div className="p-2 bg-white border border-[#C8CDD3] font-semibold text-[#102A43] text-xs">
                      {totals.amountInWords}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">
                      Narration / Dispatch Notes
                    </label>
                    <input
                      type="text"
                      value={narration}
                      onChange={e => setNarration(e.target.value)}
                      placeholder="e.g. Dispatched through Transport Corporation of India, LR No. 90283"
                      className="w-full bg-white"
                    />
                  </div>

                  <div className="flex items-center space-x-4 pt-1 text-[11px] text-[#5B6573]">
                    <span>Employee: <strong>{employeeName}</strong></span>
                    <span>•</span>
                    <span>Jurisdiction: <strong>{company?.city || 'Tiruppur'}</strong></span>
                    <span>•</span>
                    <span>Status: <strong>Ready to Post</strong></span>
                  </div>
                </div>

                {/* Calculation Breakdown Box */}
                <div className="bg-white p-3 border border-[#C8CDD3] rounded-xs space-y-1.5 font-mono text-xs shadow-2xs">
                  <div className="flex justify-between text-[#5B6573]">
                    <span>Taxable Subtotal:</span>
                    <span className="font-semibold text-[#1F2933]">₹ {totals.taxableTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#5B6573]">
                    <span>Total CGST:</span>
                    <span className="text-[#1F2933]">₹ {totals.cgstTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#5B6573]">
                    <span>Total SGST:</span>
                    <span className="text-[#1F2933]">₹ {totals.sgstTotal.toFixed(2)}</span>
                  </div>
                  {totals.igstTotal > 0 && (
                    <div className="flex justify-between text-[#5B6573]">
                      <span>Total IGST:</span>
                      <span className="text-[#1F2933]">₹ {totals.igstTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#5B6573] border-b border-[#E2E8F0] pb-1">
                    <span>Round Off:</span>
                    <span className={totals.roundOff >= 0 ? "text-slate-700" : "text-amber-700"}>
                      ₹ {totals.roundOff.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#102A43] pt-1">
                    <span>GRAND TOTAL:</span>
                    <span className="text-blue-900">₹ {totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: DASHBOARD OVERVIEW (COMPACT ACCOUNTING OVERVIEW)       */}
          {/* ============================================================== */}
          {activeTab === 'dashboard' && (
            <div className="p-4 space-y-4">
              <div className="border-b border-[#C8CDD3] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] uppercase">Financial Overview & Registers</h2>
                  <p className="text-[11px] text-[#5B6573]">Daily accounting balances and real-time ledger metrics</p>
                </div>
                <button
                  onClick={() => company?.id && refreshCompanyData(company.id)}
                  className="bg-white border border-[#C8CDD3] px-2 py-1 text-xs hover:bg-[#F0F4F8] flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Compact Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                {[
                  { label: "Active Users", val: userCounts.active_users * 100, isCount: true, color: "text-emerald-800" },
                  { label: "Total Users", val: userCounts.total_users * 100, isCount: true, color: "text-blue-900" },
                  { label: "Today's Sales", val: metrics?.total_sales_today || 0, color: "text-blue-900" },
                  { label: "Month Sales", val: metrics?.total_sales_month || 0, color: "text-blue-800" },
                  { label: "Month Purchases", val: metrics?.total_purchases_month || 0, color: "text-amber-800" },
                  { label: "Receivables", val: metrics?.total_receivables || 0, color: "text-emerald-800" },
                  { label: "Payables", val: metrics?.total_payables || 0, color: "text-rose-800" },
                  { label: "Stock Value", val: metrics?.total_stock_value || 0, color: "text-indigo-800" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-[#C8CDD3] p-2.5 rounded-2xs shadow-2xs">
                    <div className="text-[10px] font-bold text-[#5B6573] uppercase truncate">{item.label}</div>
                    <div className={`text-sm font-bold font-mono mt-1 ${item.color}`}>
                      {item.isCount ? (item.val / 100) : formatCurrency(item.val)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Print Activity Register (Dashboard Section) */}
              <div className="border border-[#C8CDD3] bg-white">
                <div className="bg-[#E2E8F0] px-3 py-1.5 border-b border-[#C8CDD3] font-bold text-xs text-[#102A43] flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Printer className="w-3.5 h-3.5 text-indigo-700" />
                    <span>RECENT INVOICE PRINT ACTIVITY</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('print_audits')}
                    className="text-[11px] text-blue-800 font-semibold hover:underline"
                  >
                    View All Print Logs →
                  </button>
                </div>
                <table className="acc-table">
                  <thead>
                    <tr>
                      <th>Date / Time</th>
                      <th>User</th>
                      <th>Invoice No</th>
                      <th>Action</th>
                      <th>Printer / Target</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printAuditList && printAuditList.length > 0 ? (
                      printAuditList.slice(0, 5).map(pa => (
                        <tr key={pa.id}>
                          <td className="font-mono text-xs">{pa.printed_at}</td>
                          <td className="font-semibold text-slate-800">{pa.username_snapshot}</td>
                          <td className="font-mono font-bold text-blue-900">{pa.invoice_number}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pa.print_type === 'PRINT' 
                                ? 'bg-red-100 text-red-800 border border-red-300' 
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                              {pa.print_type === 'PRINT' ? 'PRINTED' : 'PDF EXPORT'}
                            </span>
                          </td>
                          <td className="text-slate-600">{pa.printer_name || 'System Default'}</td>
                          <td className="text-center">
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                              {pa.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-3 text-slate-500">
                          No print activities recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Recent Transactions Table */}
              <div className="border border-[#C8CDD3] bg-white">
                <div className="bg-[#E2E8F0] px-3 py-1.5 border-b border-[#C8CDD3] font-bold text-xs text-[#102A43] flex justify-between items-center">
                  <span>RECENT POSTED TRANSACTIONS</span>
                  <span className="text-[11px] font-normal text-[#5B6573]">Last 6 postings</span>
                </div>
                <table className="acc-table">
                  <thead>
                    <tr>
                      <th>Voucher Type</th>
                      <th>Voucher No</th>
                      <th>Date</th>
                      <th>Party / Ledger</th>
                      <th className="num">Amount (₹)</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics?.recent_transactions && metrics.recent_transactions.length > 0 ? (
                      metrics.recent_transactions.map(tx => (
                        <tr key={tx.id}>
                          <td className="font-semibold text-blue-900">{tx.voucher_type}</td>
                          <td className="font-mono">{tx.voucher_number}</td>
                          <td className="font-mono">{tx.date}</td>
                          <td>{tx.party_name || 'System Account'}</td>
                          <td className="num font-bold">{formatCurrency(tx.amount)}</td>
                          <td className="text-center">
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-slate-500">
                          No transactions recorded yet. Create your first Sales Invoice!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: CUSTOMERS MASTER                                        */}
          {/* ============================================================== */}
          {activeTab === 'customers' && (
            <div className="p-4 space-y-3">
              <div className="border-b border-[#C8CDD3] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] uppercase">Customer Master (Sundry Debtors)</h2>
                  <p className="text-[11px] text-[#5B6573]">Manage buyer ledgers, credit terms, and GSTIN details</p>
                </div>
                <button
                  onClick={() => {
                    setQuickMasterType('customer');
                    setShowQuickMasterModal(true);
                  }}
                  className="bg-[#102A43] hover:bg-[#1E3A8A] text-white px-3 py-1 text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Customer (Alt+C)</span>
                </button>
              </div>

              <div className="border border-[#C8CDD3] bg-white">
                <table className="acc-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Customer Name</th>
                      <th>GSTIN</th>
                      <th>Phone</th>
                      <th>City / State</th>
                      <th className="num">Credit Limit</th>
                      <th className="num">Current Balance (Dr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr key={c.id}>
                        <td className="font-mono font-semibold text-blue-900">{c.code}</td>
                        <td className="font-bold">{c.name}</td>
                        <td className="font-mono">{c.tax_number || 'URP'}</td>
                        <td>{c.phone || '-'}</td>
                        <td>{c.city || '-'}, {c.state || '-'}</td>
                        <td className="num font-mono">{formatCurrency(c.credit_limit)}</td>
                        <td className="num font-mono font-bold text-[#102A43]">
                          {formatCurrency(c.current_balance)} Dr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: SUPPLIERS MASTER                                        */}
          {/* ============================================================== */}
          {activeTab === 'suppliers' && (
            <div className="p-4 space-y-3">
              <div className="border-b border-[#C8CDD3] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] uppercase">Supplier Master (Sundry Creditors)</h2>
                  <p className="text-[11px] text-[#5B6573]">Manage vendors, mill suppliers, and purchase ledgers</p>
                </div>
              </div>

              <div className="border border-[#C8CDD3] bg-white">
                <table className="acc-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Supplier Name</th>
                      <th>GSTIN</th>
                      <th>Phone</th>
                      <th>City / State</th>
                      <th className="num">Current Balance (Cr)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(s => (
                      <tr key={s.id}>
                        <td className="font-mono font-semibold text-blue-900">{s.code}</td>
                        <td className="font-bold">{s.name}</td>
                        <td className="font-mono">{s.tax_number || 'URP'}</td>
                        <td>{s.phone || '-'}</td>
                        <td>{s.city || '-'}, {s.state || '-'}</td>
                        <td className="num font-mono font-bold text-rose-900">
                          {formatCurrency(s.current_balance)} Cr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: PRODUCTS & INVENTORY                                    */}
          {/* ============================================================== */}
          {activeTab === 'inventory' && (
            <div className="p-4 space-y-3">
              <div className="border-b border-[#C8CDD3] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] uppercase">Stock Items & Inventory Register</h2>
                  <p className="text-[11px] text-[#5B6573]">Products, HSN classifications, stock levels, and valuations</p>
                </div>
                <button
                  onClick={() => {
                    setQuickMasterType('product');
                    setShowQuickMasterModal(true);
                  }}
                  className="bg-[#102A43] hover:bg-[#1E3A8A] text-white px-3 py-1 text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Product (Alt+C)</span>
                </button>
              </div>

              <div className="border border-[#C8CDD3] bg-white">
                <table className="acc-table">
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>HSN/SAC</th>
                      <th>Unit</th>
                      <th className="num">Buy Rate (₹)</th>
                      <th className="num">Sale Rate (₹)</th>
                      <th className="num">GST %</th>
                      <th className="num">Current Stock</th>
                      <th className="num">Stock Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const stockValPaise = p.current_stock * p.purchase_price;
                      return (
                        <tr key={p.id}>
                          <td className="font-mono font-semibold text-blue-900">{p.code}</td>
                          <td className="font-bold">{p.name}</td>
                          <td className="font-mono">{p.hsn_code || '-'}</td>
                          <td className="font-mono text-center">{p.unit || 'KGS'}</td>
                          <td className="num font-mono">{(p.purchase_price / 100).toFixed(2)}</td>
                          <td className="num font-mono font-semibold text-blue-900">{(p.selling_price / 100).toFixed(2)}</td>
                          <td className="num font-mono">{(p.tax_rate_bps / 100).toFixed(1)}%</td>
                          <td className="num font-mono font-bold text-emerald-800">{p.current_stock}</td>
                          <td className="num font-mono font-bold">{formatCurrency(stockValPaise)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: PURCHASES                                               */}
          {/* ============================================================== */}
          {activeTab === 'purchases' && (
            <div className="p-4 space-y-3">
              <div className="border-b border-[#C8CDD3] pb-2">
                <h2 className="text-base font-bold text-[#102A43] uppercase">Purchase Inward Register</h2>
                <p className="text-[11px] text-[#5B6573]">Raw material yarn, fabrics, and supplier inward billing</p>
              </div>

              <div className="p-4 bg-white border border-[#C8CDD3] text-xs">
                <p className="text-slate-600 mb-2">
                  Purchase vouchers update the inventory stock levels and Credit the Supplier ledger account atomically.
                </p>
                <div className="text-[#5B6573]">
                  Suppliers registered: <strong>{suppliers.length}</strong> | Active products: <strong>{products.length}</strong>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: TRIAL BALANCE & LEDGERS                                 */}
          {/* ============================================================== */}
          {activeTab === 'ledger' && (
            <div className="p-4 space-y-3">
              <div className="border-b border-[#C8CDD3] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] uppercase">Trial Balance & Chart of Accounts</h2>
                  <p className="text-[11px] text-[#5B6573]">Double-entry ledger balances verified atomically by SQLite</p>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 border border-emerald-300 rounded">
                  Balance Sheet Equilibrium: VERIFIED OK
                </div>
              </div>

              <div className="border border-[#C8CDD3] bg-white">
                <table className="acc-table">
                  <thead>
                    <tr>
                      <th>Account Name</th>
                      <th>Account Group / Type</th>
                      <th className="num">Debit Total (₹)</th>
                      <th className="num">Credit Total (₹)</th>
                      <th className="num">Net Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialBalance.map(t => (
                      <tr key={t.account_id}>
                        <td className="font-bold text-[#102A43]">{t.account_name}</td>
                        <td className="text-slate-600">{t.account_type}</td>
                        <td className="num font-mono">{formatCurrency(t.debit_total)}</td>
                        <td className="num font-mono">{formatCurrency(t.credit_total)}</td>
                        <td className={`num font-mono font-bold ${t.net_balance >= 0 ? "text-blue-900" : "text-rose-900"}`}>
                          {formatCurrency(Math.abs(t.net_balance))} {t.net_balance >= 0 ? "Dr" : "Cr"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 8: USB TRANSFER PACKAGE                                    */}
          {/* ============================================================== */}
          {activeTab === 'transfer' && (
            <div className="p-4 space-y-4">
              <div className="border-b border-[#C8CDD3] pb-2">
                <h2 className="text-base font-bold text-[#102A43] uppercase">USB Portable Data Transfer & Sync</h2>
                <p className="text-[11px] text-[#5B6573]">
                  Package full database, SHA-256 manifests, and documents for offline computer transfer
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Export Card */}
                <div className="bg-white border border-[#C8CDD3] p-4 space-y-3">
                  <h3 className="font-bold text-xs uppercase text-[#102A43] flex items-center space-x-1.5">
                    <UploadCloud className="w-4 h-4 text-blue-700" />
                    <span>Create Transfer Package (To USB)</span>
                  </h3>
                  <p className="text-[11px] text-[#5B6573]">
                    Flushes SQLite WAL to main database, calculates cryptographic SHA-256 hashes, and copies invoice documents.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                      Destination Folder / USB Root
                    </label>
                    <input
                      type="text"
                      value={exportDestPath}
                      onChange={e => setExportDestPath(e.target.value)}
                      className="w-full font-mono text-xs"
                      placeholder="E:\"
                    />
                  </div>
                  <button
                    onClick={handleExportPackage}
                    className="w-full bg-[#102A43] hover:bg-[#1E3A8A] text-white py-1.5 text-xs font-semibold"
                  >
                    Build & Export Portable Package
                  </button>
                  {exportProgress && <p className="text-[11px] text-blue-700 font-mono">{exportProgress}</p>}
                </div>

                {/* Import Card */}
                <div className="bg-white border border-[#C8CDD3] p-4 space-y-3">
                  <h3 className="font-bold text-xs uppercase text-[#102A43] flex items-center space-x-1.5">
                    <FolderOpen className="w-4 h-4 text-emerald-700" />
                    <span>Import Transfer Package (From USB)</span>
                  </h3>
                  <p className="text-[11px] text-[#5B6573]">
                    Verifies checksums and PRAGMA integrity, creates automatic pre-import safety backup, and replaces local data.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                      Source Package Directory
                    </label>
                    <input
                      type="text"
                      value={importSrcPath}
                      onChange={e => setImportSrcPath(e.target.value)}
                      className="w-full font-mono text-xs"
                      placeholder="E:\SDL_ACC"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleValidatePackage}
                      className="flex-1 bg-white border border-[#C8CDD3] hover:bg-[#F0F4F8] text-[#1F2933] py-1.5 text-xs font-semibold"
                    >
                      Verify Checksums
                    </button>
                    <button
                      onClick={handleImportPackage}
                      className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white py-1.5 text-xs font-semibold"
                    >
                      Safe Ingest & Replace
                    </button>
                  </div>
                  {importProgress && <p className="text-[11px] text-emerald-700 font-mono">{importProgress}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 9: LEGACY DATA IMPORT                                      */}
          {/* ============================================================== */}
          {activeTab === 'legacy' && (
            <div className="p-4 space-y-3">
              <div className="border-b border-[#C8CDD3] pb-2">
                <h2 className="text-base font-bold text-[#102A43] uppercase">Legacy Accounting Data Import</h2>
                <p className="text-[11px] text-[#5B6573]">Ingest existing customers, suppliers, and product items</p>
              </div>

              <div className="bg-white border border-[#C8CDD3] p-4 space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                    JSON Legacy Payload
                  </label>
                  <textarea
                    rows={8}
                    value={legacyText}
                    onChange={e => setLegacyText(e.target.value)}
                    className="w-full font-mono text-xs"
                  />
                </div>
                <button
                  onClick={handleExecuteLegacyImport}
                  disabled={importingLegacy}
                  className="bg-[#102A43] hover:bg-[#1E3A8A] text-white px-4 py-1.5 text-xs font-semibold"
                >
                  {importingLegacy ? 'Processing...' : 'Execute Legacy Data Ingestion'}
                </button>
                {legacyReport && (
                  <div className="p-2 bg-[#F8FAFC] border border-[#C8CDD3] font-mono text-[11px]">
                    Imported successfully: <strong>{legacyReport.imported_successfully}</strong> records.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 10: BUSINESS & INVOICE PROFILE                             */}
          {/* ============================================================== */}
          {activeTab === 'business_profile' && (
            <div className="p-4 space-y-4">
              <div className="border-b border-[#C8CDD3] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] uppercase">
                    Business Profile & Tax Invoice Configuration
                  </h2>
                  <p className="text-[11px] text-[#5B6573]">
                    Details printed on the Sri Dhanalakshmi Agencies A4 Tax Invoice document
                  </p>
                </div>
                <button
                  onClick={handleSaveBusinessProfile}
                  className="bg-[#102A43] hover:bg-[#1E3A8A] text-white px-4 py-1.5 text-xs font-bold shadow-xs"
                >
                  Save Profile Configuration
                </button>
              </div>

              <form onSubmit={handleSaveBusinessProfile} className="space-y-4 text-xs">
                
                {/* SECTION A: BUSINESS DETAILS */}
                <div className="bg-[#F8FAFC] border border-[#C8CDD3] p-3 space-y-3">
                  <div className="font-bold text-[#102A43] text-xs uppercase border-b border-[#E2E8F0] pb-1">
                    Section A — Legal Business & Branch Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        Legal Business Name *
                      </label>
                      <input
                        type="text"
                        value={bpName}
                        onChange={e => setBpName(e.target.value)}
                        required
                        className="w-full font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        Trade Name
                      </label>
                      <input
                        type="text"
                        value={bpTradeName}
                        onChange={e => setBpTradeName(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        GSTIN Number *
                      </label>
                      <input
                        type="text"
                        value={bpGstin}
                        onChange={e => setBpGstin(e.target.value)}
                        required
                        className="w-full font-mono font-bold text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={bpPan}
                        onChange={e => setBpPan(e.target.value)}
                        className="w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        Address Line 1 (Registered Office)
                      </label>
                      <input
                        type="text"
                        value={bpAddress1}
                        onChange={e => setBpAddress1(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        Address Line 2 (Area / Landmark)
                      </label>
                      <input
                        type="text"
                        value={bpAddress2}
                        onChange={e => setBpAddress2(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={bpCity}
                        onChange={e => setBpCity(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        State
                      </label>
                      <input
                        type="text"
                        value={bpState}
                        onChange={e => setBpState(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        State Code (e.g. 33)
                      </label>
                      <input
                        type="text"
                        value={bpStateCode}
                        onChange={e => setBpStateCode(e.target.value)}
                        className="w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={bpPin}
                        onChange={e => setBpPin(e.target.value)}
                        className="w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={bpPhone}
                        onChange={e => setBpPhone(e.target.value)}
                        className="w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={bpEmail}
                        onChange={e => setBpEmail(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        Website
                      </label>
                      <input
                        type="text"
                        value={bpWebsite}
                        onChange={e => setBpWebsite(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        Invoice Prefix
                      </label>
                      <input
                        type="text"
                        value={bpPrefix}
                        onChange={e => setBpPrefix(e.target.value)}
                        className="w-full font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION E: BANK & PAYMENT DETAILS */}
                <div className="bg-[#F8FAFC] border border-[#C8CDD3] p-3 space-y-3">
                  <div className="font-bold text-[#102A43] text-xs uppercase border-b border-[#E2E8F0] pb-1">
                    Section E — Bank & Settlement Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bpBankName}
                        onChange={e => setBpBankName(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        Branch
                      </label>
                      <input
                        type="text"
                        value={bpBankBranch}
                        onChange={e => setBpBankBranch(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bpBankAccNo}
                        onChange={e => setBpBankAccNo(e.target.value)}
                        className="w-full font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={bpBankIfsc}
                        onChange={e => setBpBankIfsc(e.target.value)}
                        className="w-full font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-1">
                        UPI VPA / ID
                      </label>
                      <input
                        type="text"
                        value={bpBankUpi}
                        onChange={e => setBpBankUpi(e.target.value)}
                        className="w-full font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="submit"
                    className="bg-[#102A43] hover:bg-[#1E3A8A] text-white px-5 py-2 text-xs font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 12: USER MANAGEMENT                                        */}
          {/* ============================================================== */}
          {activeTab === 'users' && (
            <div className="p-4 space-y-3">
              <div className="border-b border-[#C8CDD3] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] uppercase">User Management & Role-Based Access</h2>
                  <p className="text-[11px] text-[#5B6573]">Local role permissions, credential security, and user status control</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1 text-xs font-mono mr-2">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 border border-emerald-300 font-bold rounded">
                      ACTIVE: {userCounts.active_users}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 border border-slate-300 font-bold rounded">
                      TOTAL: {userCounts.total_users}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-[#102A43] hover:bg-[#1E3A8A] text-white px-3 py-1 text-xs font-semibold flex items-center space-x-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add User</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-[#C8CDD3] bg-white">
                <table className="acc-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Username</th>
                      <th>Display Name</th>
                      <th>Role</th>
                      <th className="text-center">Status</th>
                      <th>Created Date</th>
                      <th>Last Login</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList && usersList.length > 0 ? (
                      usersList.map(u => (
                        <tr key={u.id}>
                          <td className="font-mono text-xs text-slate-500">{u.id}</td>
                          <td className="font-bold text-blue-900">{u.username}</td>
                          <td>{u.display_name}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 border border-slate-300">
                              {u.role_id}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.is_active ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="font-mono text-xs">{u.created_at?.slice(0, 16)}</td>
                          <td className="font-mono text-xs">{u.last_login_at ? u.last_login_at.slice(0, 16) : 'Never'}</td>
                          <td className="text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  u.is_active ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                                }`}
                                title={u.is_active ? 'Deactivate User' : 'Activate User'}
                              >
                                {u.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                              </button>
                              <button
                                onClick={() => {
                                  setPasswordResetModalUser(u);
                                  setResetNewPassword('');
                                }}
                                className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200"
                                title="Reset Password"
                              >
                                RESET PWD
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center py-4 text-slate-500">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 13: INVOICE PRINT ACTIVITY SCREEN                           */}
          {/* ============================================================== */}
          {activeTab === 'print_audits' && (
            <div className="p-4 space-y-3">
              <div className="border-b border-[#C8CDD3] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] uppercase">Invoice Print Activity & Audit</h2>
                  <p className="text-[11px] text-[#5B6573]">Immutable print logs: who printed what invoice, when, and device destination</p>
                </div>
                <button
                  onClick={() => company?.id && refreshCompanyData(company.id)}
                  className="bg-white border border-[#C8CDD3] px-2 py-1 text-xs hover:bg-[#F0F4F8] flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Log</span>
                </button>
              </div>

              <div className="border border-[#C8CDD3] bg-white">
                <table className="acc-table">
                  <thead>
                    <tr>
                      <th>Date / Time</th>
                      <th>User</th>
                      <th>Invoice No</th>
                      <th>Action</th>
                      <th>Printer / Target</th>
                      <th>Document</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printAuditList && printAuditList.length > 0 ? (
                      printAuditList.map(pa => (
                        <tr key={pa.id}>
                          <td className="font-mono text-xs">{pa.printed_at}</td>
                          <td className="font-semibold text-blue-900">{pa.username_snapshot}</td>
                          <td className="font-mono font-bold">{pa.invoice_number}</td>
                          <td>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pa.print_type === 'PRINT' 
                                ? 'bg-red-100 text-red-800 border border-red-300' 
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}>
                              {pa.print_type === 'PRINT' ? 'PRINTED' : 'PDF EXPORT'}
                            </span>
                          </td>
                          <td className="text-slate-700">{pa.printer_name || 'System Default'}</td>
                          <td className="font-mono text-xs text-slate-500">{pa.document_type}</td>
                          <td className="text-center">
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold">
                              {pa.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-slate-500">
                          No invoice print audits logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 14: SYSTEM AUDIT LOGS SCREEN                               */}
          {/* ============================================================== */}
          {activeTab === 'audits' && (
            <div className="p-4 space-y-3">
              <div className="border-b border-[#C8CDD3] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] uppercase">System Audit Trail</h2>
                  <p className="text-[11px] text-[#5B6573]">Append-only system security and transaction records</p>
                </div>
                <button
                  onClick={() => company?.id && refreshCompanyData(company.id)}
                  className="bg-white border border-[#C8CDD3] px-2 py-1 text-xs hover:bg-[#F0F4F8] flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh Trail</span>
                </button>
              </div>

              <div className="border border-[#C8CDD3] bg-white">
                <table className="acc-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditList && auditList.length > 0 ? (
                      auditList.map(a => (
                        <tr key={a.id}>
                          <td className="font-mono text-xs">{a.timestamp?.slice(0, 19)}</td>
                          <td className="font-semibold text-blue-900">{a.username_snapshot}</td>
                          <td>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 border border-slate-300">
                              {a.action}
                            </span>
                          </td>
                          <td className="font-mono text-xs text-slate-600">{a.entity_type} {a.entity_id ? `(${a.entity_id})` : ''}</td>
                          <td className="text-slate-800">{a.description}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-slate-500">
                          No audit entries logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 11: STORAGE & BACKUP                                       */}
          {/* ============================================================== */}
          {activeTab === 'settings' && (
            <div className="p-4 space-y-3">
              <div className="border-b border-[#C8CDD3] pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#102A43] uppercase">Storage, Database & Safety Backups</h2>
                  <p className="text-[11px] text-[#5B6573]">Path management, atomic snapshots, and safe removal</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleBackup}
                    className="bg-[#102A43] text-white hover:bg-[#1E3A8A] px-3 py-1 text-xs font-semibold"
                  >
                    Take Manual Backup
                  </button>
                  <button
                    onClick={handleSafeEject}
                    className="bg-amber-700 text-white hover:bg-amber-800 px-3 py-1 text-xs font-semibold"
                  >
                    Safe Eject / Flush WAL
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[#C8CDD3] p-4 text-xs space-y-2 font-mono">
                <div><strong>Deployment Mode:</strong> {storage?.mode || 'Desktop Installed'}</div>
                <div><strong>Database Path:</strong> {storage?.database_path || 'C:\\ProgramData\\SDL_ACC\\Data\\sdl_acc.db'}</div>
                <div><strong>Documents Directory:</strong> {storage?.documents_directory || 'C:\\ProgramData\\SDL_ACC\\Documents'}</div>
                <div><strong>Backups Directory:</strong> {storage?.backups_directory || 'C:\\ProgramData\\SDL_ACC\\Backups'}</div>
                <div><strong>USB Portable Flag:</strong> {storage?.is_usb_portable ? 'YES (Running from USB)' : 'NO (Local Windows PC)'}</div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* 3. STATUS BAR (BOTTOM WINDOW BAR)                              */}
      {/* ============================================================== */}
      <footer className="h-6 bg-[#E2E8F0] border-t border-[#C8CDD3] px-3 flex items-center justify-between text-[11px] text-[#1F2933] shrink-0 font-mono">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
            <span>Status: Ready</span>
          </span>
          <span>|</span>
          <span>Database: SQLite (WAL Active)</span>
          <span>|</span>
          <span>Backup: OK</span>
          <span>|</span>
          <span>Customers: {customers.length}</span>
          <span>|</span>
          <span>Products: {products.length}</span>
        </div>

        <div className="flex items-center space-x-4 text-[#5B6573]">
          <span>App: NXT-BILLS v2.0 (Black Peak Studio)</span>
          <span>|</span>
          <span>Offline Native</span>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* 4. EXACT A4 INVOICE PRINT PREVIEW MODAL                        */}
      {/* ============================================================== */}
      {showPrintModal && previewInvoiceData && (
        <div className="fixed inset-0 z-50 bg-black/75 flex flex-col items-center justify-start overflow-hidden print-modal-overlay">
          
          {/* Modal Header Controls */}
          <div className="w-full bg-[#102A43] text-white px-4 py-2 flex items-center justify-between border-b border-black text-xs shrink-0 shadow-md no-print">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-amber-300 tracking-wide uppercase">
                Print Preview — Tax Invoice
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-200">
                Paper: <strong>A4 Portrait</strong> (210mm × 297mm)
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-200">
                Invoice: <strong>{previewInvoiceData.invoiceNumber}</strong>
              </span>
            </div>

            {/* Zoom Controls & Print Action */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-[#1E3A8A] px-2 py-0.5 rounded text-white text-xs">
                <button
                  type="button"
                  onClick={() => setPrintZoom(z => Math.max(0.5, z - 0.1))}
                  className="hover:text-amber-300 p-0.5"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-1.5 font-mono">{Math.round(printZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setPrintZoom(z => Math.min(1.5, z + 0.1))}
                  className="hover:text-amber-300 p-0.5"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPrintZoom(0.95)}
                  className="text-[10px] ml-1 text-slate-200 hover:text-white underline"
                >
                  Fit
                </button>
              </div>

              {/* PRINT BUTTON (Triggers native window.print()) */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.recordPrintAudit({
                      invoice_id: previewInvoiceData.invoiceNumber,
                      invoice_number: previewInvoiceData.invoiceNumber,
                      user_id: currentUser?.id,
                      username_snapshot: currentUser?.username || 'admin',
                      print_type: 'PRINT',
                      printer_name: 'System Default Printer',
                      document_type: 'TAX_INVOICE',
                    });
                    if (company?.id) refreshCompanyData(company.id);
                  } catch (e) {
                    console.error('Audit failed', e);
                  }
                  window.print();
                }}
                className="bg-[#D4121C] hover:bg-[#B50F18] text-white px-4 py-1 text-xs font-bold rounded flex items-center space-x-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>PRINT DOCUMENT (Ctrl+P)</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.recordPrintAudit({
                      invoice_id: previewInvoiceData.invoiceNumber,
                      invoice_number: previewInvoiceData.invoiceNumber,
                      user_id: currentUser?.id,
                      username_snapshot: currentUser?.username || 'admin',
                      print_type: 'PDF',
                      printer_name: 'Microsoft Print to PDF',
                      document_type: 'TAX_INVOICE',
                    });
                    if (company?.id) refreshCompanyData(company.id);
                  } catch (e) {
                    console.error('Audit failed', e);
                  }
                  window.print();
                }}
                className="bg-white hover:bg-slate-100 text-[#102A43] px-3 py-1 text-xs font-semibold rounded flex items-center space-x-1"
                title="Select 'Save as PDF' or 'Microsoft Print to PDF' in the system dialog"
              >
                <span>Save PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-300 hover:text-white p-1"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Preview Body (Scrollable container hosting scaled A4 document) */}
          <div className="flex-1 w-full overflow-auto p-6 flex justify-center bg-slate-800/80 print-modal-scroll">
            <div
              className="print-modal-zoom-container"
              style={{
                transform: `scale(${printZoom})`,
                transformOrigin: 'top center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                backgroundColor: '#FFFFFF',
              }}
            >
              <InvoicePrintDocument data={previewInvoiceData} id="invoice-preview-screen" />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. QUICK MASTER CREATION MODAL (Alt+C)                          */}
      {/* ============================================================== */}
      {showQuickMasterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#102A43] shadow-2xl w-full max-w-lg p-4 space-y-3 text-xs">
            
            <div className="flex items-center justify-between border-b border-[#C8CDD3] pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#102A43] text-sm uppercase">Quick Master Creation</span>
                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-[10px] font-mono">Alt+C</span>
              </div>
              <button onClick={() => setShowQuickMasterModal(false)} className="text-slate-500 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector: Customer vs Product */}
            <div className="flex space-x-2 border-b border-[#E2E8F0] pb-2">
              <button
                type="button"
                onClick={() => setQuickMasterType('customer')}
                className={`flex-1 py-1 font-semibold rounded-2xs ${
                  quickMasterType === 'customer' ? 'bg-[#102A43] text-white' : 'bg-[#F0F4F8] text-[#1F2933]'
                }`}
              >
                Party / Customer Master
              </button>
              <button
                type="button"
                onClick={() => setQuickMasterType('product')}
                className={`flex-1 py-1 font-semibold rounded-2xs ${
                  quickMasterType === 'product' ? 'bg-[#102A43] text-white' : 'bg-[#F0F4F8] text-[#1F2933]'
                }`}
              >
                Stock Item / Product Master
              </button>
            </div>

            {/* Quick Customer Form */}
            {quickMasterType === 'customer' && (
              <form onSubmit={handleSaveQuickCustomer} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={qcName}
                    onChange={e => setQcName(e.target.value)}
                    placeholder="e.g. S.K. Textiles & Processing"
                    className="w-full font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">GSTIN Number</label>
                    <input
                      type="text"
                      value={qcGstin}
                      onChange={e => setQcGstin(e.target.value)}
                      placeholder="33AAAAA0000A1Z5"
                      className="w-full font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Phone Number</label>
                    <input
                      type="text"
                      value={qcPhone}
                      onChange={e => setQcPhone(e.target.value)}
                      placeholder="9842100000"
                      className="w-full font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">City</label>
                    <input
                      type="text"
                      value={qcCity}
                      onChange={e => setQcCity(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">State</label>
                    <input
                      type="text"
                      value={qcState}
                      onChange={e => setQcState(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">State Code</label>
                    <input
                      type="text"
                      value={qcStateCode}
                      onChange={e => setQcStateCode(e.target.value)}
                      className="w-full font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Address</label>
                  <input
                    type="text"
                    value={qcAddress}
                    onChange={e => setQcAddress(e.target.value)}
                    placeholder="Street, Area, Landmark"
                    className="w-full"
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setShowQuickMasterModal(false)}
                    className="bg-white border border-[#C8CDD3] px-3 py-1 font-semibold hover:bg-slate-50"
                  >
                    Cancel (Esc)
                  </button>
                  <button
                    type="submit"
                    className="bg-[#102A43] hover:bg-[#1E3A8A] text-white px-4 py-1 font-bold"
                  >
                    Save & Return to Bill
                  </button>
                </div>
              </form>
            )}

            {/* Quick Product Form */}
            {quickMasterType === 'product' && (
              <form onSubmit={handleSaveQuickProduct} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Product / Item Name *</label>
                  <input
                    type="text"
                    required
                    value={qpName}
                    onChange={e => setQpName(e.target.value)}
                    placeholder="e.g. Cotton Yarn 40s Combed"
                    className="w-full font-bold"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">HSN / SAC Code</label>
                    <input
                      type="text"
                      value={qpHsn}
                      onChange={e => setQpHsn(e.target.value)}
                      className="w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Unit</label>
                    <input
                      type="text"
                      value={qpUnit}
                      onChange={e => setQpUnit(e.target.value)}
                      className="w-full font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">GST Rate %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={qpGstRate}
                      onChange={e => setQpGstRate(e.target.value)}
                      className="w-full font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Buy Rate (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={qpBuyRate}
                      onChange={e => setQpBuyRate(e.target.value)}
                      className="w-full font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Sale Rate (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={qpSellRate}
                      onChange={e => setQpSellRate(e.target.value)}
                      className="w-full font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Opening Stock</label>
                    <input
                      type="number"
                      step="any"
                      value={qpOpeningStock}
                      onChange={e => setQpOpeningStock(e.target.value)}
                      className="w-full font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setShowQuickMasterModal(false)}
                    className="bg-white border border-[#C8CDD3] px-3 py-1 font-semibold hover:bg-slate-50"
                  >
                    Cancel (Esc)
                  </button>
                  <button
                    type="submit"
                    className="bg-[#102A43] hover:bg-[#1E3A8A] text-white px-4 py-1 font-bold"
                  >
                    Save & Add to Bill
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5B. ADD USER MODAL                                             */}
      {/* ============================================================== */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#102A43] shadow-2xl w-full max-w-md p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#C8CDD3] pb-2">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-blue-900" />
                <span className="font-bold text-[#102A43] text-sm uppercase">Create New System User</span>
              </div>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-500 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Username *</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="e.g. rahul, sai"
                  className="w-full font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Display Name *</label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Role *</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full"
                >
                  <option value="ADMIN">ADMIN (Full System Access)</option>
                  <option value="MANAGER">MANAGER (Operations & Approvals)</option>
                  <option value="ACCOUNTANT">ACCOUNTANT (Books & Ledgers)</option>
                  <option value="BILLING_OPERATOR">BILLING_OPERATOR (Sales Invoicing & Printing)</option>
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="bg-white border border-[#C8CDD3] px-3 py-1 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#102A43] hover:bg-[#1E3A8A] text-white px-4 py-1 font-bold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5C. RESET PASSWORD MODAL                                       */}
      {/* ============================================================== */}
      {passwordResetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#102A43] shadow-2xl w-full max-w-sm p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#C8CDD3] pb-2">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-[#102A43] text-sm uppercase">Reset Password</span>
              </div>
              <button onClick={() => setPasswordResetModalUser(null)} className="text-slate-500 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[#5B6573]">
              Setting a new password for user: <strong>{passwordResetModalUser.username}</strong> ({passwordResetModalUser.display_name})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5B6573] uppercase mb-0.5">New Password *</label>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={e => setResetNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setPasswordResetModalUser(null)}
                  className="bg-white border border-[#C8CDD3] px-3 py-1 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#102A43] hover:bg-[#1E3A8A] text-white px-4 py-1 font-bold"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>

      {/* ============================================================== */}
      {/* 6. DEDICATED DIRECT-TO-PRINTER ELEMENT (0 margin, top: 0)     */}
      {/* ============================================================== */}
      {previewInvoiceData && (
        <div id="invoice-print-root" className="print-only">
          <InvoicePrintDocument data={previewInvoiceData} id="invoice-printable-area" />
        </div>
      )}
    </>
  );
}
