# SDL ACC
## Offline Desktop Accounting, Sales, Purchase & Inventory Management System

---

## 1. Project Overview

**SDL ACC** is a Windows-first, offline desktop accounting and business monitoring application designed primarily for personal use.

The project aims to provide the essential accounting, billing, inventory, and monitoring capabilities expected from a traditional desktop accounting system while maintaining a lightweight, portable, offline-first architecture.

SDL ACC will operate as a **standalone desktop application**, not as a website. The application's database and supporting files will be stored locally and can optionally be placed on a USB flash drive for portable use.

### Primary Objective

Build a reliable personal accounting system capable of:

- Sales monitoring
- Purchase monitoring
- Stock maintenance and monitoring
- Debit notes
- Credit notes
- Ledger management
- Accounting reports
- Offline operation
- USB/pendrive database storage
- USB/pendrive document storage
- Automatic backups
- Safe database handling
- Desktop application execution

---

# 2. Project Vision

The vision of SDL ACC is to create a simple but technically reliable accounting application that provides the core functionality needed to monitor business transactions without depending on internet connectivity or cloud services.

The application should prioritize:

> **Reliability → Data Integrity → Offline Availability → Simplicity → Usability**

The first version will focus on the most important accounting and inventory workflows rather than attempting to implement every enterprise accounting feature.

---

# 3. Project Objectives

## 3.1 Primary Objectives

1. Develop a standalone Windows desktop accounting application.
2. Enable complete offline operation.
3. Store financial and inventory data locally using SQLite.
4. Support portable data storage through USB drives.
5. Implement double-entry accounting principles.
6. Automatically connect sales and purchase transactions with inventory and ledgers.
7. Provide sales and purchase monitoring dashboards.
8. Provide stock maintenance and stock movement reports.
9. Support debit notes and credit notes.
10. Provide detailed ledger views.
11. Generate useful accounting and operational reports.
12. Implement automatic backup and restore functionality.
13. Protect data against accidental loss and database corruption.
14. Maintain a modular architecture that can be expanded later.

---

# 4. Scope of Version 1

SDL ACC V1 will focus on the following modules:

```text
SDL ACC
│
├── Dashboard
├── Company Management
├── Sales
├── Purchase
├── Inventory
├── Debit Notes
├── Credit Notes
├── Ledgers
├── Reports
├── Backup & Restore
└── Settings
```

---

# 5. Technology Stack

## 5.1 Desktop Framework

**Tauri 2**

Tauri will be used to package SDL ACC as a native-feeling Windows desktop application.

Advantages:

- Lightweight
- Low memory usage
- Standalone executable
- Native OS integration
- File-system access
- USB/storage detection
- Windows installer support
- No browser required by the user

---

## 5.2 Frontend

### React

React will be used to build the application interface.

### TypeScript

TypeScript will provide:

- Type safety
- Maintainable frontend code
- Better development experience
- Reliable data models

### Vite

Vite will be used as the frontend build system.

### Tailwind CSS

Tailwind CSS will be used for application styling.

### shadcn/ui

shadcn/ui will be used for reusable interface components.

### Recharts

Recharts will be used for:

- Sales charts
- Purchase charts
- Stock charts
- Trend analysis
- Dashboard visualizations

---

# 6. Backend / Business Logic

For this project, a traditional continuously running backend server is not required.

The recommended architecture is:

```text
React
   ↓
Tauri
   ↓
Rust
   ↓
SQLite
```

Rust/Tauri commands will handle:

- Database operations
- File operations
- Backup operations
- USB storage handling
- Accounting calculations
- Inventory calculations
- Report generation
- Application-level system operations

This makes the application genuinely offline and portable.

---

# 7. Database

## SQLite

SQLite will be the primary database engine.

The database will contain:

- Company information
- Customers
- Suppliers
- Products
- Sales
- Purchases
- Debit notes
- Credit notes
- Ledger entries
- Stock transactions
- Payments
- Receipts
- Reports metadata
- Application settings

Example:

```text
SDL_ACC/
│
├── Data/
│   └── company.sqlite
│
├── Documents/
│   ├── Sales/
│   ├── Purchases/
│   ├── DebitNotes/
│   └── CreditNotes/
│
└── Backups/
```

---

# 8. Accounting Engine

The accounting engine is the core of SDL ACC.

Every financial transaction should follow double-entry accounting principles.

### Fundamental Rule

```text
TOTAL DEBIT = TOTAL CREDIT
```

The system should never allow a posted journal transaction to violate this rule.

---

# 9. Sales Module

## 9.1 Sales Invoice

Sales invoices should support:

- Invoice number
- Invoice date
- Customer
- Product
- Quantity
- Rate
- Discount
- Tax
- Total
- Payment status
- Notes

## 9.2 Sales Register

The application should provide:

- Daily sales
- Weekly sales
- Monthly sales
- Yearly sales
- Customer-wise sales
- Product-wise sales
- Invoice-wise sales
- Cash sales
- Credit sales
- Sales returns
- Cancelled invoices

## 9.3 Sales Dashboard

Display:

- Today's sales
- Monthly sales
- Total invoices
- Average invoice value
- Cash sales
- Credit sales
- Sales returns
- Net sales
- Top customers
- Top-selling products

---

# 10. Purchase Module

## 10.1 Purchase Entry

Purchase transactions should contain:

- Purchase number
- Purchase date
- Supplier
- Product
- Quantity
- Rate
- Discount
- Tax
- Total
- Payment status
- Notes

## 10.2 Purchase Register

Provide:

- Daily purchases
- Weekly purchases
- Monthly purchases
- Yearly purchases
- Supplier-wise purchases
- Product-wise purchases
- Purchase returns
- Outstanding supplier balances
- Purchase trends

## 10.3 Purchase Dashboard

Display:

- Today's purchases
- Monthly purchases
- Total purchase value
- Pending supplier payments
- Purchase returns
- Top suppliers
- Frequently purchased products

---

# 11. Inventory / Stock Management

Inventory is a primary module of SDL ACC.

## 11.1 Product Master

Each product should support:

- Product name
- Product code
- SKU
- Category
- Unit
- Purchase price
- Selling price
- Tax rate
- Opening stock
- Reorder level
- Optional HSN/SAC
- Notes

## 11.2 Stock Operations

Support:

- Opening stock
- Stock in
- Stock out
- Sales-based stock reduction
- Purchase-based stock increase
- Stock adjustment
- Stock transfer
- Stock returns
- Stock correction

## 11.3 Stock Reports

Provide:

- Current stock
- Stock register
- Product-wise stock
- Category-wise stock
- Low-stock report
- Stock movement
- Stock valuation
- Opening stock
- Closing stock
- Fast-moving products
- Slow-moving products

## 11.4 Automatic Inventory Integration

### Sales

```text
Sales Invoice
      ↓
Stock OUT
      ↓
Inventory Updated
```

### Purchase

```text
Purchase Invoice
      ↓
Stock IN
      ↓
Inventory Updated
```

---

# 12. Debit Note Module

Debit notes should be used for transactions such as purchase returns or adjustments against suppliers.

Example:

```text
Purchase
₹50,000
     ↓
Goods Returned
₹5,000
     ↓
Debit Note
₹5,000
```

The system should automatically update:

- Supplier balance
- Purchase adjustment
- Inventory
- Ledger
- Tax information where applicable

---

# 13. Credit Note Module

Credit notes should be used for sales returns and customer-side adjustments.

Example:

```text
Sales
₹30,000
     ↓
Customer Return
₹4,000
     ↓
Credit Note
₹4,000
```

The system should automatically update:

- Customer balance
- Sales adjustment
- Inventory
- Ledger
- Tax information where applicable

---

# 14. Ledger Management

SDL ACC should provide detailed ledger views.

## Ledger Types

- Customer ledger
- Supplier ledger
- Cash ledger
- Bank ledger
- Sales ledger
- Purchase ledger
- Expense ledger
- General ledger
- Tax ledger

Example:

```text
CUSTOMER LEDGER

Date       Particular       Debit      Credit      Balance

01/10      Opening                       20,000      20,000 Cr
03/10      Invoice           15,000                  5,000 Cr
05/10      Payment                       10,000      5,000 Dr
```

Ledger filtering should support:

- Date range
- Party
- Transaction type
- Debit
- Credit
- Opening balance
- Closing balance

---

# 15. Dashboard

The SDL ACC dashboard should provide a quick overview of business activity.

Example:

```text
SDL ACC
Financial Year: 2026-27

---------------------------------------------
SALES              ₹8,42,500
PURCHASES          ₹5,31,200
STOCK VALUE        ₹4,82,300
RECEIVABLES        ₹2,14,500
PAYABLES           ₹1,42,300
---------------------------------------------
```

### Dashboard Components

- Sales summary
- Purchase summary
- Stock value
- Receivables
- Payables
- Recent transactions
- Sales trend
- Purchase trend
- Low-stock alerts
- Outstanding balances

---

# 16. Reports

## Accounting Reports

- Day Book
- Ledger
- Trial Balance
- Profit & Loss
- Balance Sheet
- Receivables
- Payables

## Sales Reports

- Sales Register
- Customer-wise Sales
- Product-wise Sales
- Monthly Sales
- Sales Returns

## Purchase Reports

- Purchase Register
- Supplier-wise Purchase
- Product-wise Purchase
- Monthly Purchase
- Purchase Returns

## Inventory Reports

- Stock Summary
- Stock Register
- Stock Movement
- Stock Valuation
- Low Stock
- Product-wise Stock

---

# 17. Offline Architecture

SDL ACC must operate without internet access.

```text
                SDL ACC
                   │
              Desktop App
                   │
                SQLite
                   │
       ┌───────────┴───────────┐
       │                       │
   Accounting              Documents
       │                       │
 Sales/Purchase          Invoices/PDFs
 Stock/Ledgers           Attachments
```

Internet should not be required for:

- Creating invoices
- Recording purchases
- Updating stock
- Creating debit notes
- Creating credit notes
- Viewing ledgers
- Generating reports
- Searching transactions
- Backing up data

---

# 18. USB / Pendrive Support

USB portability is a core requirement.

SDL ACC should support two storage modes.

## Mode 1 — Local Storage

```text
C:\SDL_ACC\
```

## Mode 2 — Portable USB Storage

```text
E:\SDL_ACC\
```

The USB directory can contain:

```text
SDL_ACC/
│
├── SDL_ACC.exe
├── Data/
│   └── company.sqlite
│
├── Documents/
│
└── Backups/
```

The application should be able to detect the selected storage location and use it as the primary data directory.

---

# 19. Portable Mode

The application should support a portable mode where the user can carry the data on a USB drive.

Workflow:

```text
Connect USB
      ↓
Open SDL ACC
      ↓
Select Portable Database
      ↓
Work Offline
      ↓
Save Transactions
      ↓
Close SDL ACC
      ↓
Safe Eject
      ↓
Remove USB
```

The application should provide a dedicated:

**Safe Eject USB**

function.

Before ejecting, SDL ACC should:

1. Commit pending transactions.
2. Close database connections.
3. Save pending files.
4. Flush filesystem operations.
5. Close the database.
6. Confirm that the USB can be removed.

---

# 20. Backup and Restore

USB storage introduces a physical failure risk.

Therefore SDL ACC should automatically create backups.

Example:

```text
C:\SDL_ACC_BACKUPS\
│
├── 2026-10-10\
├── 2026-10-11\
└── 2026-10-12\
```

Features:

- Manual backup
- Automatic backup
- Backup history
- Restore backup
- Database verification
- Backup before major operations
- Backup before restore

---

# 21. Data Integrity

The system must prioritize accounting data integrity.

Important rules:

### Rule 1

Every posted accounting transaction must balance.

```text
Debit = Credit
```

### Rule 2

Sales must update inventory correctly.

### Rule 3

Purchases must update inventory correctly.

### Rule 4

Debit notes must update the appropriate supplier/accounting balances.

### Rule 5

Credit notes must update the appropriate customer/accounting balances.

### Rule 6

Financial transactions should use atomic database transactions.

Example:

```text
BEGIN TRANSACTION

Create Invoice
Create Ledger Entries
Update Stock
Update Customer Balance

COMMIT
```

If any operation fails:

```text
ROLLBACK
```

This prevents partially completed transactions.

---

# 22. User Interface Design

SDL ACC should look and behave like a desktop accounting application, not a website.

## Design Principles

- Desktop-first
- Compact but readable
- Keyboard-friendly
- Fast navigation
- Minimal animations
- Clear tables
- Professional accounting layout
- Search-first workflows
- Keyboard shortcuts
- Right-click/context actions where useful

## Main Navigation

```text
Dashboard
Sales
Purchase
Inventory
Debit Note
Credit Note
Ledgers
Reports
Backup
Settings
```

---

# 23. Search

A global search system should allow quick searching across:

- Customers
- Suppliers
- Products
- Invoices
- Purchase records
- Debit notes
- Credit notes
- Ledger entries
- Transaction numbers

Example:

```text
Search: INV-1024

→ Sales Invoice #INV-1024
→ Customer
→ Amount
→ Date
→ Ledger
→ Stock movement
```

---

# 24. Keyboard-First Operation

Because accounting software is frequently data-entry heavy, keyboard support should be a priority.

Potential shortcuts:

```text
Ctrl + N       New Transaction
Ctrl + S       Save
Ctrl + F       Search
Ctrl + P       Print
Ctrl + B       Backup
Esc            Close/Cancel
F2             Edit
F4             Select Party
F8             Sales
F9             Purchase
```

The exact shortcut map can be finalized during UI development.

---

# 25. Security

Even though SDL ACC is intended for personal use, basic security should be included.

Features:

- Application lock
- Optional PIN/password
- Database encryption
- Backup protection
- Automatic session lock
- Safe database shutdown

Passwords should never be stored as plain text.

---

# 26. Document Storage

Documents should be stored separately from the core database.

```text
Documents/
│
├── Sales/
│   ├── 2026/
│   └── 2027/
│
├── Purchases/
│
├── DebitNotes/
│
└── CreditNotes/
```

This keeps the SQLite database smaller and easier to maintain.

---

# 27. PDF and Export

SDL ACC should support:

- Invoice PDF
- Ledger PDF
- Sales report PDF
- Purchase report PDF
- Stock report PDF
- CSV export
- Excel export

---

# 28. Recommended Technology Stack

| Layer | Technology |
|---|---|
| Desktop Framework | Tauri 2 |
| Frontend | React |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Charts | Recharts |
| Native/Desktop Logic | Rust |
| Database | SQLite |
| Database Access | SQLx / rusqlite |
| PDF | HTML/CSS to PDF or Rust PDF tooling |
| Data Export | CSV / XLSX |
| Testing | Rust tests + frontend tests |
| Packaging | Tauri Windows Installer |
| Storage | Local Disk / USB |
| Network Requirement | None |

---

# 29. High-Level Architecture

```text
                         SDL ACC
                            │
                    ┌───────┴───────┐
                    │   Tauri 2     │
                    │ Desktop Shell │
                    └───────┬───────┘
                            │
                    React + TypeScript
                            │
                    ┌───────┴────────┐
                    │                │
                 UI Layer       Tauri Commands
                    │                │
                    └───────┬────────┘
                            │
                         Rust Core
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
 Accounting Engine     Inventory Engine    File/Backup Engine
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                          SQLite
                            │
             ┌──────────────┴──────────────┐
             │                             │
        Accounting Data              Document Storage
             │                             │
         Sales/Purchase                PDFs/Files
         Ledgers/Notes
         Stock/Reports
```

---

# 30. Database Structure

Initial database entities should include:

```text
companies
financial_years

customers
suppliers

products
product_categories
units

sales
sales_items

purchases
purchase_items

debit_notes
debit_note_items

credit_notes
credit_note_items

ledger_accounts
ledger_entries

stock_transactions

payments
receipts

expenses

documents

backups

application_settings
```

The exact schema should be finalized after designing the accounting transaction model.

---

# 31. Development Roadmap

## Phase 1 — Foundation

- Project setup
- Tauri setup
- React setup
- SQLite setup
- Database migrations
- Application configuration
- Storage path management

### Deliverable

A working offline desktop shell connected to SQLite.

---

## Phase 2 — Master Data

Implement:

- Company
- Customers
- Suppliers
- Products
- Categories
- Units
- Ledger accounts

### Deliverable

Complete master-data management.

---

## Phase 3 — Accounting Engine

Implement:

- Double-entry system
- Debit/Credit
- Journal entries
- Ledger posting
- Opening balances
- Transaction validation
- Atomic transactions

### Deliverable

Reliable accounting core.

---

## Phase 4 — Sales

Implement:

- Sales invoice
- Sales register
- Customer balances
- Sales reports
- Automatic stock reduction
- Automatic ledger posting

### Deliverable

Complete sales workflow.

---

## Phase 5 — Purchase

Implement:

- Purchase entry
- Purchase register
- Supplier balances
- Purchase reports
- Automatic stock increase
- Automatic ledger posting

### Deliverable

Complete purchase workflow.

---

## Phase 6 — Inventory

Implement:

- Stock management
- Stock register
- Stock movements
- Stock adjustment
- Stock valuation
- Low-stock monitoring

### Deliverable

Integrated inventory system.

---

## Phase 7 — Debit & Credit Notes

Implement:

- Debit notes
- Credit notes
- Returns
- Ledger adjustments
- Inventory adjustments
- Related reporting

### Deliverable

Complete adjustment/return workflow.

---

## Phase 8 — Reports & Dashboard

Implement:

- Dashboard
- Sales reports
- Purchase reports
- Stock reports
- Ledger reports
- Trial balance
- P&L
- Balance sheet
- Outstanding reports

### Deliverable

Complete monitoring and reporting system.

---

## Phase 9 — USB & Backup

Implement:

- Portable mode
- USB database location
- USB document storage
- Backup
- Restore
- Database verification
- Safe eject

### Deliverable

Reliable portable offline accounting environment.

---

## Phase 10 — Polish & Release

Implement:

- Keyboard shortcuts
- Error handling
- Loading states
- Empty states
- Printing
- PDF export
- Excel export
- Application settings
- Installer
- Portable build
- Crash recovery
- Final testing

### Deliverable

Stable SDL ACC desktop application.

---

# 32. Testing Strategy

Testing should focus heavily on financial correctness.

## Accounting Tests

Verify:

```text
Debit = Credit
```

for every posted transaction.

## Sales Tests

Verify:

```text
Invoice
→ Ledger
→ Customer Balance
→ Stock
```

## Purchase Tests

Verify:

```text
Purchase
→ Ledger
→ Supplier Balance
→ Stock
```

## Returns

Verify:

```text
Credit Note
→ Customer
→ Sales
→ Stock
```

and:

```text
Debit Note
→ Supplier
→ Purchase
→ Stock
```

## Storage Tests

Test:

- Local database
- USB database
- USB removal
- Database recovery
- Backup
- Restore
- Corrupted database handling

---

# 33. Error Handling

The application must never silently fail.

Example:

```text
Database unavailable

The selected storage device may have been disconnected.

[Retry]
[Change Storage]
[Exit]
```

For USB removal:

```text
WARNING

SDL ACC cannot access the database because
the selected USB drive is unavailable.

Do not modify or remove additional files.

[Reconnect]
[Open Local Backup]
[Exit]
```

---

# 34. Future Expansion

The architecture should allow future addition of:

- GST
- HSN/SAC
- E-invoice
- E-way bill
- Bank reconciliation
- Multiple companies
- Multiple financial years
- Batch inventory
- Godowns
- Barcode scanning
- Advanced stock valuation
- AI invoice OCR
- AI business assistant
- Automated financial insights

These features are intentionally outside the core V1 scope.

---

# 35. Final Project Definition

**SDL ACC** will be a:

> **Portable, offline-first Windows desktop accounting and business monitoring application with integrated sales, purchase, inventory, debit note, credit note, ledger, reporting, backup, and USB storage capabilities.**

The application will prioritize:

```text
OFFLINE
   ↓
LOCAL
   ↓
PORTABLE
   ↓
RELIABLE
   ↓
ACCOUNTING ACCURACY
   ↓
FAST DESKTOP EXPERIENCE
```

The final V1 should be capable of running without internet access, storing its database on a local drive or USB drive, maintaining synchronized accounting and inventory records, and producing useful operational and financial reports from the stored data.
