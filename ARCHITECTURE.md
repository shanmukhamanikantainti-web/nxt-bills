# SDL ACC — Architecture & Engineering Specification

## 1. System Overview
**SDL ACC** is an offline-first Windows desktop accounting, billing, and inventory management application designed for local and USB portable usage.

- **Desktop Framework**: Tauri 2
- **Frontend Architecture**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts
- **Application Core**: Rust native binary layer with strict transactional boundaries
- **Database Engine**: SQLite 3 with WAL (Write-Ahead Logging), Foreign Key constraints, and atomic transactions via `rusqlite`
- **Double-Entry Enforcement**: Pure balanced journal vouchers (`Total Debit == Total Credit`)

---

## 2. Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│               SDL ACC Desktop UI                       │
│           React 19 + TypeScript + Tailwind             │
│                                                        │
│  [Dashboard] [Sales] [Purchases] [Inventory]           │
│  [Customers] [Suppliers] [Trial Balance] [Settings]    │
└───────────────────────────┬────────────────────────────┘
                            │
                      Tauri 2 IPC
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Rust Application Core                 │
│                                                        │
│  • Accounting Engine (Double-entry validation)         │
│  • Inventory Engine (Stock transaction audit trail)    │
│  • Master Data Engine (Customers, Suppliers, Products) │
│  • Portable USB & Storage Manager                      │
│  • Backup & Safe-Eject Controller                      │
└───────────────────────────┬────────────────────────────┘
                            │
                      SQLite 3 (WAL)
                            │
┌───────────────────────────▼────────────────────────────┐
│                   Storage Location                     │
│                                                        │
│  Local: Documents/SDL_ACC/Data/company.sqlite          │
│  USB:   <Drive>:/SDL_ACC/Data/company.sqlite           │
│  Backups: SDL_ACC/Backups/                             │
└────────────────────────────────────────────────────────┘
```

---

## 3. Storage Hierarchy & USB Portability
When placed on removable media, the application dynamically resolves its root storage directory:
```
SDL_ACC/
├── Data/
│   └── company.sqlite
├── Documents/
│   ├── Sales/
│   ├── Purchases/
│   ├── DebitNotes/
│   └── CreditNotes/
└── Backups/
```
- Safe Eject flushes WAL journals (`PRAGMA wal_checkpoint(TRUNCATE)`) and safely closes active handles before ejection.
- Atomic backups use `VACUUM INTO` and verify database integrity (`PRAGMA integrity_check`) before confirming success.

---

## 4. Double-Entry Accounting
Every financial posting follows the strict equality:
$$\sum \text{Debit} = \sum \text{Credit}$$
- Sales: Debit Customer/Cash, Credit Sales Revenue, Credit Tax Payable.
- Purchases: Debit COGS, Debit Tax Input, Credit Supplier/Cash.
- Ledger accounts maintain real-time running balances verified against journal lines.
