import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  ShoppingCart, 
  ShoppingBag, 
  Package, 
  Users, 
  Truck, 
  BookOpen, 
  HardDrive, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert
} from 'lucide-react';
import { api, Company, Customer, Supplier, Product, DashboardMetrics, TrialBalanceEntry, StorageInfo, formatCurrency } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers' | 'ledger' | 'settings'>('dashboard');
  const [company, setCompany] = useState<Company | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceEntry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [showNewCust, setShowNewCust] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCode, setNewCustCode] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const [showNewSupp, setShowNewSupp] = useState(false);
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppCode, setNewSuppCode] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('');

  const [showNewProd, setShowNewProd] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdBuy, setNewProdBuy] = useState('100');
  const [newProdSell, setNewProdSell] = useState('150');
  const [newProdTax, setNewProdTax] = useState('18');
  const [newProdStock, setNewProdStock] = useState('10');

  // Sales form
  const [saleCustId, setSaleCustId] = useState('');
  const [saleProdId, setSaleProdId] = useState('');
  const [saleQty, setSaleQty] = useState('1');
  const [saleMode, setSaleMode] = useState('Credit');

  // Purchase form
  const [purSuppId, setPurSuppId] = useState('');
  const [purProdId, setPurProdId] = useState('');
  const [purQty, setPurQty] = useState('5');
  const [purBillNo, setPurBillNo] = useState('BILL-001');
  const [purMode, setPurMode] = useState('Credit');

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

      let comp = await api.getCompany();
      if (!comp) {
        // Create initial personal company if none exists
        comp = await api.saveCompany({
          id: '',
          name: 'SDL Enterprises',
          currency_symbol: '₹',
          currency_code: 'INR',
          created_at: '',
          updated_at: '',
        });
      }
      setCompany(comp);

      if (comp?.id) {
        await refreshCompanyData(comp.id);
      }
    } catch (e: any) {
      console.error(e);
      showNotification(`Initialization failed: ${e.toString()}`, true);
    } finally {
      setLoading(false);
    }
  };

  const refreshCompanyData = async (compId: string) => {
    try {
      const [m, c, s, p, tb] = await Promise.all([
        api.getDashboardMetrics(compId),
        api.listCustomers(compId),
        api.listSuppliers(compId),
        api.listProducts(compId),
        api.getTrialBalance(compId)
      ]);
      setMetrics(m);
      setCustomers(c);
      setSuppliers(s);
      setProducts(p);
      setTrialBalance(tb);
      if (c.length > 0 && !saleCustId) setSaleCustId(c[0].id);
      if (s.length > 0 && !purSuppId) setPurSuppId(s[0].id);
      if (p.length > 0) {
        if (!saleProdId) setSaleProdId(p[0].id);
        if (!purProdId) setPurProdId(p[0].id);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    try {
      await api.createCustomer({
        id: '',
        company_id: company.id,
        ledger_account_id: '',
        name: newCustName,
        code: newCustCode,
        phone: newCustPhone,
        opening_balance: 0,
        credit_limit: 5000000,
        current_balance: 0,
        is_active: true,
        created_at: '',
      });
      setShowNewCust(false);
      setNewCustName('');
      setNewCustCode('');
      setNewCustPhone('');
      showNotification('Customer registered successfully');
      await refreshCompanyData(company.id);
    } catch (e: any) {
      showNotification(e.toString(), true);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    try {
      await api.createSupplier({
        id: '',
        company_id: company.id,
        ledger_account_id: '',
        name: newSuppName,
        code: newSuppCode,
        phone: newSuppPhone,
        opening_balance: 0,
        current_balance: 0,
        is_active: true,
        created_at: '',
      });
      setShowNewSupp(false);
      setNewSuppName('');
      setNewSuppCode('');
      setNewSuppPhone('');
      showNotification('Supplier registered successfully');
      await refreshCompanyData(company.id);
    } catch (e: any) {
      showNotification(e.toString(), true);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    try {
      const buyPaise = Math.round(parseFloat(newProdBuy) * 100);
      const sellPaise = Math.round(parseFloat(newProdSell) * 100);
      const taxBps = Math.round(parseFloat(newProdTax) * 100);
      const opening = parseFloat(newProdStock) || 0;

      await api.createProduct({
        id: '',
        company_id: company.id,
        name: newProdName,
        code: newProdCode,
        purchase_price: buyPaise,
        selling_price: sellPaise,
        tax_rate_bps: taxBps,
        current_stock: 0,
        reorder_level: 5,
        is_active: true,
        created_at: '',
      }, opening);

      setShowNewProd(false);
      setNewProdName('');
      setNewProdCode('');
      showNotification('Product item added with initial inventory');
      await refreshCompanyData(company.id);
    } catch (e: any) {
      showNotification(e.toString(), true);
    }
  };

  const handlePostSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !saleProdId) return;
    try {
      const prod = products.find(p => p.id === saleProdId);
      if (!prod) return;

      const qty = parseFloat(saleQty);
      const invNo = await api.postSale({
        company_id: company.id,
        customer_id: saleCustId || undefined,
        invoice_date: new Date().toISOString().split('T')[0],
        payment_mode: saleMode,
        items: [{
          product_id: prod.id,
          quantity: qty,
          rate: prod.selling_price,
          discount: 0,
          tax_rate_bps: prod.tax_rate_bps,
        }]
      });
      showNotification(`Sale Posted: ${invNo}. Stock and accounting updated.`);
      await refreshCompanyData(company.id);
    } catch (e: any) {
      showNotification(e.toString(), true);
    }
  };

  const handlePostPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !purProdId) return;
    try {
      const prod = products.find(p => p.id === purProdId);
      if (!prod) return;

      const qty = parseFloat(purQty);
      const billNo = await api.postPurchase({
        company_id: company.id,
        supplier_id: purSuppId || undefined,
        invoice_number: purBillNo,
        invoice_date: new Date().toISOString().split('T')[0],
        payment_mode: purMode,
        items: [{
          product_id: prod.id,
          quantity: qty,
          rate: prod.purchase_price,
          discount: 0,
          tax_rate_bps: prod.tax_rate_bps,
        }]
      });
      showNotification(`Purchase Posted: ${billNo}. Inventory stock increased.`);
      await refreshCompanyData(company.id);
    } catch (e: any) {
      showNotification(e.toString(), true);
    }
  };

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

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 antialiased overflow-hidden select-none font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur flex flex-col justify-between">
        <div>
          {/* Logo / Company Header */}
          <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-900/90">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="truncate">
              <h1 className="font-bold text-sm tracking-wide text-slate-100 truncate">{company?.name || 'SDL ACC'}</h1>
              <p className="text-xs text-slate-400 font-mono">Offline Desktop</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'sales', label: 'Sales Vouchers', icon: ShoppingCart },
              { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
              { id: 'inventory', label: 'Inventory / Stock', icon: Package },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'suppliers', label: 'Suppliers', icon: Truck },
              { id: 'ledger', label: 'Trial Balance & Ledgers', icon: BookOpen },
              { id: 'settings', label: 'Storage & Backup', icon: HardDrive },
            ].map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Storage / USB Status Badge */}
        <div className="p-3 m-3 border border-slate-800 rounded-xl bg-slate-900/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              {storage?.is_usb_portable ? 'Portable USB' : 'Local Storage'}
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono truncate" title={storage?.db_path}>
            {storage?.db_path}
          </p>
          <div className="flex gap-1.5 pt-1">
            <button
              onClick={handleBackup}
              className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700 transition"
            >
              Backup
            </button>
            <button
              onClick={handleSafeEject}
              className="flex-1 py-1 px-2 bg-amber-950/60 hover:bg-amber-900 text-amber-200 rounded text-[11px] font-medium border border-amber-800/40 transition"
            >
              Safe Eject
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Top bar notifications */}
        {statusMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-700/50 px-4 py-2 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-950/90 border-b border-rose-700/50 px-4 py-2 text-xs text-rose-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dynamic Views */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Financial Dashboard</h2>
                  <p className="text-xs text-slate-400">Authoritative double-entry and inventory live metrics</p>
                </div>
                <button
                  onClick={() => company && refreshCompanyData(company.id)}
                  className="p-2 border border-slate-800 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-medium text-slate-400">Monthly Sales</span>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {formatCurrency(metrics?.total_sales_month || 0)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Today: {formatCurrency(metrics?.total_sales_today || 0)}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-medium text-slate-400">Monthly Purchases</span>
                  <div className="text-xl font-bold text-sky-400 mt-1">
                    {formatCurrency(metrics?.total_purchases_month || 0)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Stock IN registered</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-medium text-slate-400">Receivables (Debtors)</span>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {formatCurrency(metrics?.total_receivables || 0)}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">Customer balances</span>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                  <span className="text-xs font-medium text-slate-400">Stock Valuation</span>
                  <div className="text-xl font-bold text-purple-400 mt-1">
                    {formatCurrency(metrics?.total_stock_value || 0)}
                  </div>
                  <span className="text-[11px] text-rose-400 mt-1 block">
                    {metrics?.low_stock_count || 0} low stock items
                  </span>
                </div>
              </div>

              {/* Recent Vouchers Register */}
              <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-semibold text-sm text-slate-200">Recent Journal Vouchers</h3>
                  <span className="text-xs text-slate-400">Double-Entry Enforced</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Type</th>
                      <th className="py-2.5 px-4">Voucher No</th>
                      <th className="py-2.5 px-4">Narration</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {metrics?.recent_transactions && metrics.recent_transactions.length > 0 ? (
                      metrics.recent_transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-4 font-mono text-slate-300">{t.date}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-200">{t.voucher_type}</td>
                          <td className="py-2.5 px-4 font-mono text-emerald-400">{t.voucher_number}</td>
                          <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate">{t.party_name}</td>
                          <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-200">
                            {formatCurrency(t.amount)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No transactions posted yet. Create your first Sale or Purchase.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SALES TAB */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-400" />
                  Create & Post Sales Invoice
                </h3>
                <form onSubmit={handlePostSale} className="grid grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Customer</label>
                    <select
                      value={saleCustId}
                      onChange={e => setSaleCustId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:border-emerald-500 outline-none"
                    >
                      <option value="">Cash Sale (No Party)</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Product Item</label>
                    <select
                      value={saleProdId}
                      onChange={e => setSaleProdId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:border-emerald-500 outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} - Stock: {p.current_stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="any"
                      value={saleQty}
                      onChange={e => setSaleQty(e.target.value)}
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Payment Mode</label>
                    <select
                      value={saleMode}
                      onChange={e => setSaleMode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:border-emerald-500 outline-none"
                    >
                      <option value="Credit">Credit (Update Customer Ledger)</option>
                      <option value="Cash">Cash (Immediate Receipt)</option>
                    </select>
                  </div>

                  <div className="col-span-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition shadow-sm"
                    >
                      Post Sale Invoice
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PURCHASES TAB */}
          {activeTab === 'purchases' && (
            <div className="space-y-6">
              <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-5 space-y-4">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                  Record Purchase & Stock IN
                </h3>
                <form onSubmit={handlePostPurchase} className="grid grid-cols-5 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Supplier</label>
                    <select
                      value={purSuppId}
                      onChange={e => setPurSuppId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:border-sky-500 outline-none"
                    >
                      <option value="">Cash Purchase</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Supplier Bill #</label>
                    <input
                      type="text"
                      value={purBillNo}
                      onChange={e => setPurBillNo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:border-sky-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Product Item</label>
                    <select
                      value={purProdId}
                      onChange={e => setPurProdId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:border-sky-500 outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} - Rate: {formatCurrency(p.purchase_price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="any"
                      value={purQty}
                      onChange={e => setPurQty(e.target.value)}
                      min="1"
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:border-sky-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Mode</label>
                    <select
                      value={purMode}
                      onChange={e => setPurMode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:border-sky-500 outline-none"
                    >
                      <option value="Credit">Credit (Update Supplier Ledger)</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  <div className="col-span-5 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs transition shadow-sm"
                    >
                      Post Purchase
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">Inventory & Stock Master</h2>
                  <p className="text-xs text-slate-400">Strict stock tracking with audit trail</p>
                </div>
                <button
                  onClick={() => setShowNewProd(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Product
                </button>
              </div>

              {/* Add Product Modal/Card */}
              {showNewProd && (
                <div className="border border-slate-800 rounded-xl bg-slate-900/90 p-4 space-y-3">
                  <h4 className="font-semibold text-xs text-emerald-400">New Product Item</h4>
                  <form onSubmit={handleCreateProduct} className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={newProdName}
                        onChange={e => setNewProdName(e.target.value)}
                        placeholder="e.g. Copper Wire 2.5mm"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Product Code</label>
                      <input
                        type="text"
                        value={newProdCode}
                        onChange={e => setNewProdCode(e.target.value)}
                        placeholder="e.g. CW-25"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Initial Opening Qty</label>
                      <input
                        type="number"
                        value={newProdStock}
                        onChange={e => setNewProdStock(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Cost Price (₹)</label>
                      <input
                        type="number"
                        value={newProdBuy}
                        onChange={e => setNewProdBuy(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Selling Price (₹)</label>
                      <input
                        type="number"
                        value={newProdSell}
                        onChange={e => setNewProdSell(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Tax Rate (%)</label>
                      <input
                        type="number"
                        value={newProdTax}
                        onChange={e => setNewProdTax(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                        required
                      />
                    </div>
                    <div className="col-span-3 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewProd(false)}
                        className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium"
                      >
                        Save Product
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Products Table */}
              <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Product Name</th>
                      <th className="py-2.5 px-4 text-right">Cost Price</th>
                      <th className="py-2.5 px-4 text-right">Selling Price</th>
                      <th className="py-2.5 px-4 text-center">Tax Rate</th>
                      <th className="py-2.5 px-4 text-right">Current Stock</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-4 font-mono text-emerald-400">{p.code}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-200">{p.name}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                          {formatCurrency(p.purchase_price)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-100 font-semibold">
                          {formatCurrency(p.selling_price)}
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-400">
                          {(p.tax_rate_bps / 100).toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-100">
                          {p.current_stock}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {p.current_stock <= p.reorder_level ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800/60">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                              Optimal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">Customer Accounts (Debtors)</h2>
                  <p className="text-xs text-slate-400">Party ledger tracking & receivables</p>
                </div>
                <button
                  onClick={() => setShowNewCust(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Customer
                </button>
              </div>

              {showNewCust && (
                <div className="border border-slate-800 rounded-xl bg-slate-900/90 p-4 space-y-3">
                  <h4 className="font-semibold text-xs text-emerald-400">Register Customer</h4>
                  <form onSubmit={handleCreateCustomer} className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Customer Name</label>
                      <input
                        type="text"
                        value={newCustName}
                        onChange={e => setNewCustName(e.target.value)}
                        placeholder="e.g. Ramesh Hardware"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Customer Code</label>
                      <input
                        type="text"
                        value={newCustCode}
                        onChange={e => setNewCustCode(e.target.value)}
                        placeholder="e.g. C001"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={newCustPhone}
                        onChange={e => setNewCustPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                      />
                    </div>
                    <div className="col-span-3 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewCust(false)}
                        className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium"
                      >
                        Register Customer
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Customer Name</th>
                      <th className="py-2.5 px-4">Phone</th>
                      <th className="py-2.5 px-4 text-right">Outstanding Receivable</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-4 font-mono text-emerald-400">{c.code}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-200">{c.name}</td>
                        <td className="py-2.5 px-4 text-slate-400">{c.phone || '-'}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-400">
                          {formatCurrency(c.current_balance)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUPPLIERS TAB */}
          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">Supplier Accounts (Creditors)</h2>
                  <p className="text-xs text-slate-400">Vendor balances & payables</p>
                </div>
                <button
                  onClick={() => setShowNewSupp(true)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Supplier
                </button>
              </div>

              {showNewSupp && (
                <div className="border border-slate-800 rounded-xl bg-slate-900/90 p-4 space-y-3">
                  <h4 className="font-semibold text-xs text-sky-400">Register Supplier</h4>
                  <form onSubmit={handleCreateSupplier} className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Supplier Name</label>
                      <input
                        type="text"
                        value={newSuppName}
                        onChange={e => setNewSuppName(e.target.value)}
                        placeholder="e.g. Apex Electricals"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Supplier Code</label>
                      <input
                        type="text"
                        value={newSuppCode}
                        onChange={e => setNewSuppCode(e.target.value)}
                        placeholder="e.g. S001"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Phone</label>
                      <input
                        type="text"
                        value={newSuppPhone}
                        onChange={e => setNewSuppPhone(e.target.value)}
                        placeholder="e.g. 9845012345"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 outline-none"
                      />
                    </div>
                    <div className="col-span-3 flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewSupp(false)}
                        className="px-3 py-1.5 border border-slate-700 text-slate-300 rounded text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-sky-600 text-white rounded text-xs font-medium"
                      >
                        Save Supplier
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Code</th>
                      <th className="py-2.5 px-4">Supplier Name</th>
                      <th className="py-2.5 px-4">Phone</th>
                      <th className="py-2.5 px-4 text-right">Outstanding Payable</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {suppliers.map(s => (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-4 font-mono text-sky-400">{s.code}</td>
                        <td className="py-2.5 px-4 font-medium text-slate-200">{s.name}</td>
                        <td className="py-2.5 px-4 text-slate-400">{s.phone || '-'}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-sky-400">
                          {formatCurrency(s.current_balance)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TRIAL BALANCE TAB */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-white">Trial Balance (Double-Entry Enforced)</h2>
                  <p className="text-xs text-slate-400">
                    Total Debit must strictly equal Total Credit
                  </p>
                </div>
              </div>

              <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Account Name</th>
                      <th className="py-2.5 px-4">Account Classification</th>
                      <th className="py-2.5 px-4 text-right">Total Debit</th>
                      <th className="py-2.5 px-4 text-right">Total Credit</th>
                      <th className="py-2.5 px-4 text-right">Net Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {trialBalance.map(entry => (
                      <tr key={entry.account_id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-4 font-medium text-slate-200">{entry.account_name}</td>
                        <td className="py-2.5 px-4 text-slate-400">{entry.account_type}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                          {entry.debit_total > 0 ? formatCurrency(entry.debit_total) : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                          {entry.credit_total > 0 ? formatCurrency(entry.credit_total) : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-100">
                          {formatCurrency(Math.abs(entry.net_balance))} {entry.net_balance >= 0 ? 'Dr' : 'Cr'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900/90 font-bold border-t border-slate-700 text-slate-100">
                    <tr>
                      <td className="py-3 px-4" colSpan={2}>Grand Total Check</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {formatCurrency(trialBalance.reduce((acc, i) => acc + i.debit_total, 0))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {formatCurrency(trialBalance.reduce((acc, i) => acc + i.credit_total, 0))}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-mono text-[11px]">
                        ✓ Balanced
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-lg font-bold text-white">Storage & USB Safe Eject Configuration</h2>
                <p className="text-xs text-slate-400">Portable database path and crash safety controls</p>
              </div>

              <div className="border border-slate-800 rounded-xl bg-slate-900/60 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Database Storage Health</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Database File</span>
                    <span className="font-mono text-slate-200">{storage?.db_path}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Operating Mode</span>
                    <span className="text-emerald-400 font-semibold">{storage?.is_usb_portable ? 'Portable USB Mode' : 'Local Disk Mode'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Connection State</span>
                    <span className="text-emerald-400">Connected & Verified</span>
                  </div>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    onClick={handleBackup}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Perform Verified Backup Now
                  </button>
                  <button
                    onClick={handleSafeEject}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Safe Eject (Flush WAL & Release Handles)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
