# SDL ACC — Software Requirements Specification (SRS)

**Project Name:** SDL ACC  
**Document Type:** Software Requirements Specification  
**Version:** 1.0  
**Platform:** Windows Desktop  
**Application Type:** Offline Desktop Accounting & Inventory Management System  
**Primary Storage:** SQLite  
**Portable Storage:** USB / Pendrive  
**Architecture:** React + TypeScript + Tauri 2 + Rust + SQLite

---

# 1. Introduction

## 1.1 Purpose

This Software Requirements Specification defines the functional, non-functional, technical, and operational requirements for **SDL ACC**, an offline desktop accounting and business management application.

SDL ACC is intended to provide a reliable desktop environment for managing:

- Sales
- Purchases
- Inventory
- Debit notes
- Credit notes
- Ledgers
- Payments
- Receipts
- Expenses
- Accounting reports
- Stock reports
- Backups
- Portable USB-based data storage

The system is intended primarily for personal/local use and does not depend on cloud infrastructure or continuous internet connectivity.

---

# 2. Product Scope

SDL ACC shall be a standalone Windows desktop application.

The application shall allow the user to create and manage accounting transactions from a local database.

The core workflow is:

```text
User
  ↓
SDL ACC Desktop UI
  ↓
Tauri
  ↓
Rust Application Core
  ↓
SQLite Database
  ↓
Accounting + Inventory + Reporting
```

The system shall operate without internet access.

---

# 3. Objectives

SDL ACC shall:

1. Maintain accurate accounting records.
2. Follow double-entry accounting principles.
3. Maintain sales and purchase records.
4. Automatically update stock based on transactions.
5. Maintain customer and supplier ledgers.
6. Support debit and credit notes.
7. Generate financial and operational reports.
8. Support local and USB storage.
9. Provide reliable backup and restore.
10. Minimize the risk of data corruption.
11. Provide a fast desktop-oriented user experience.
12. Remain maintainable and extensible.

---

# 4. Definitions

| Term | Meaning |
|---|---|
| SDL ACC | Name of the accounting application |
| Company | Business entity managed in the application |
| Customer | Party to whom goods/services are sold |
| Supplier | Party from whom goods/services are purchased |
| Ledger | Account containing financial transactions |
| Voucher | Accounting transaction record |
| Sales Invoice | Document representing a sales transaction |
| Purchase Invoice | Document representing a purchase transaction |
| Debit Note | Adjustment document generally used against a supplier |
| Credit Note | Adjustment document generally used against a customer |
| Stock IN | Increase in inventory |
| Stock OUT | Decrease in inventory |
| Portable Mode | Running the application/data from removable storage |
| Financial Year | Accounting period |
| Backup | Copy of application data used for recovery |

---

# 5. Users and Actors

## 5.1 Primary User

SDL ACC is designed primarily for a single authorized user.

The primary user can:

- Configure the company
- Manage masters
- Create transactions
- View ledgers
- Manage inventory
- Generate reports
- Backup data
- Restore data
- Configure application settings

## 5.2 External Actors

The application may interact with:

- Windows operating system
- Local file system
- USB storage devices
- Printer
- PDF generation system

Internet services are not required for core operation.

---

# 6. System Architecture Requirements

## 6.1 Architecture

The system shall use the following architecture:

```text
┌─────────────────────────────┐
│       React + TypeScript    │
│          UI Layer           │
└──────────────┬──────────────┘
               │
               │ Tauri Commands
               ↓
┌─────────────────────────────┐
│          Rust Core          │
│                             │
│ Accounting Engine           │
│ Inventory Engine            │
│ Report Engine               │
│ Backup Engine               │
│ File Management             │
└──────────────┬──────────────┘
               │
               ↓
┌─────────────────────────────┐
│           SQLite            │
│       Local Database        │
└─────────────────────────────┘
```

---

# 7. Functional Requirements

## FR-001 — Application Startup

The system shall:

1. Start as a Windows desktop application.
2. Load the configured storage location.
3. Detect the database.
4. Validate database accessibility.
5. Initialize the application environment.
6. Display the dashboard after successful initialization.

If the database cannot be accessed, the application shall display an appropriate error.

---

# 8. Company Management

## FR-010 — Create Company

The system shall allow the user to create a company.

Company information may include:

- Company name
- Address
- Phone
- Email
- Tax/GST information
- Financial year
- Currency
- Logo
- Storage location

## FR-011 — Edit Company

The user shall be able to modify company information.

## FR-012 — Financial Year

The system shall support financial-year configuration.

The financial year shall be associated with accounting transactions.

---

# 9. Customer Management

## FR-020 — Customer Creation

The user shall be able to create customer records.

Customer information:

- Customer name
- Customer code
- Phone
- Email
- Address
- Tax/GST information
- Opening balance
- Credit limit
- Notes

## FR-021 — Customer Search

The system shall support customer search by:

- Name
- Code
- Phone
- Email

## FR-022 — Customer Ledger

The user shall be able to view the complete financial history of a customer.

---

# 10. Supplier Management

## FR-030 — Supplier Creation

The system shall allow supplier creation.

Supplier information:

- Supplier name
- Supplier code
- Phone
- Email
- Address
- Tax/GST information
- Opening balance
- Credit terms
- Notes

## FR-031 — Supplier Search

The system shall support supplier search.

## FR-032 — Supplier Ledger

The system shall display supplier transaction history.

---

# 11. Product Management

## FR-040 — Product Creation

The system shall allow product creation.

Product attributes:

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
- HSN/SAC where applicable
- Notes

## FR-041 — Product Search

Products shall be searchable by:

- Name
- Code
- SKU
- Category

## FR-042 — Product Status

Products may be marked as active/inactive.

Inactive products should not appear in normal transaction selection.

---

# 12. Sales Module

## FR-050 — Create Sales Invoice

The system shall allow the user to create a sales invoice.

Invoice fields:

- Invoice number
- Date
- Customer
- Products
- Quantity
- Rate
- Discount
- Tax
- Total
- Payment mode
- Notes

## FR-051 — Invoice Calculation

The system shall calculate:

```text
Item Amount
= Quantity × Rate

Net Amount
= Gross Amount - Discount

Final Amount
= Net Amount + Applicable Taxes
```

All financial calculations shall use exact decimal-safe representations.

## FR-052 — Sales Posting

When a sales invoice is posted, the system shall:

1. Save the invoice.
2. Create accounting entries.
3. Update customer balance where applicable.
4. Reduce inventory.
5. Create stock transactions.
6. Update relevant ledgers.

These operations shall occur atomically.

## FR-053 — Sales Register

The system shall provide a sales register with filtering by:

- Date
- Customer
- Invoice number
- Product
- Amount
- Payment status

## FR-054 — Sales Cancellation

The system shall support controlled cancellation of invoices.

Cancellation must not silently delete accounting history.

---

# 13. Purchase Module

## FR-060 — Create Purchase Invoice

The system shall allow purchase transactions.

Fields:

- Purchase number
- Date
- Supplier
- Products
- Quantity
- Rate
- Discount
- Tax
- Total
- Payment mode
- Notes

## FR-061 — Purchase Posting

When a purchase is posted, the system shall:

1. Save the purchase.
2. Create accounting entries.
3. Update supplier balance.
4. Increase stock.
5. Create stock transactions.

## FR-062 — Purchase Register

The system shall provide purchase filtering by:

- Date
- Supplier
- Purchase number
- Product
- Amount
- Payment status

---

# 14. Inventory Requirements

## FR-070 — Stock Calculation

The system shall calculate current stock using stock transactions.

Conceptually:

```text
Closing Stock
=
Opening Stock
+ Stock IN
- Stock OUT
± Adjustments
```

## FR-071 — Stock Register

The system shall provide a chronological stock movement register.

## FR-072 — Stock Adjustment

The user shall be able to create authorized stock adjustments.

The system shall require a reason for manual adjustment.

## FR-073 — Low Stock

The system shall identify products where:

```text
Current Stock <= Reorder Level
```

## FR-074 — Stock Valuation

The system shall support stock valuation according to the valuation method selected during implementation.

The valuation method must be clearly documented and consistently applied.

---

# 15. Debit Note Requirements

## FR-080 — Create Debit Note

The user shall be able to create a debit note.

A debit note may reference:

- Supplier
- Purchase transaction
- Returned items
- Adjustment amount
- Reason

## FR-081 — Debit Note Posting

The system shall update:

- Supplier ledger
- Purchase adjustment
- Inventory where applicable
- Accounting entries

---

# 16. Credit Note Requirements

## FR-090 — Create Credit Note

The user shall be able to create a credit note.

A credit note may reference:

- Customer
- Sales invoice
- Returned items
- Adjustment amount
- Reason

## FR-091 — Credit Note Posting

The system shall update:

- Customer ledger
- Sales adjustment
- Inventory where applicable
- Accounting entries

---

# 17. Accounting Engine

## FR-100 — Double-Entry Accounting

Every posted accounting transaction shall satisfy:

```text
Total Debit = Total Credit
```

The system shall reject invalid unbalanced journal entries.

## FR-101 — Journal Entries

The system shall maintain journal entries containing:

- Transaction ID
- Date
- Voucher type
- Account
- Debit
- Credit
- Description
- Reference

## FR-102 — Atomic Posting

Accounting and inventory updates must be executed inside database transactions.

Example:

```text
BEGIN TRANSACTION

Create Voucher
Create Journal Entries
Update Ledger
Update Stock

COMMIT
```

If any operation fails:

```text
ROLLBACK
```

No partially posted transaction should remain.

---

# 18. Ledger Requirements

## FR-110 — Ledger Accounts

The system shall support accounts such as:

- Cash
- Bank
- Customers
- Suppliers
- Sales
- Purchases
- Expenses
- Assets
- Liabilities
- Capital
- Tax accounts

## FR-111 — Ledger View

The ledger shall display:

- Date
- Particulars
- Reference
- Debit
- Credit
- Balance

## FR-112 — Ledger Filtering

The user shall be able to filter ledger data by:

- Date range
- Account
- Voucher type
- Reference

---

# 19. Payments and Receipts

## FR-120 — Payment Entry

The system shall support outgoing payments.

A payment may be linked to:

- Supplier
- Expense
- Loan/liability
- Other ledger accounts

## FR-121 — Receipt Entry

The system shall support incoming receipts.

A receipt may be linked to:

- Customer
- Sales invoice
- Other income
- Other ledger accounts

---

# 20. Expense Management

## FR-130 — Expense Entry

The system shall support expense recording.

Expense fields:

- Date
- Expense account
- Amount
- Payment mode
- Description
- Reference

The expense shall automatically create corresponding ledger entries.

---

# 21. Dashboard Requirements

## FR-140 — Dashboard

The dashboard shall display a summary of the current business state.

Possible metrics:

- Today's sales
- Monthly sales
- Today's purchases
- Monthly purchases
- Current stock value
- Receivables
- Payables
- Total invoices
- Low-stock products
- Recent transactions

## FR-141 — Charts

The dashboard may provide:

- Sales trend
- Purchase trend
- Stock trend
- Category-wise sales
- Top products

---

# 22. Reporting Requirements

## FR-150 — Day Book

The system shall display chronological accounting transactions.

## FR-151 — Trial Balance

The system shall calculate debit and credit balances for ledger accounts.

The trial balance should satisfy:

```text
Total Debit = Total Credit
```

## FR-152 — Profit & Loss

The system shall calculate income and expenses for the selected period.

## FR-153 — Balance Sheet

The system shall provide a balance-sheet report based on the accounting data available in the system.

## FR-154 — Sales Reports

Reports shall include:

- Sales register
- Customer-wise sales
- Product-wise sales
- Date-wise sales
- Sales returns

## FR-155 — Purchase Reports

Reports shall include:

- Purchase register
- Supplier-wise purchases
- Product-wise purchases
- Date-wise purchases
- Purchase returns

## FR-156 — Inventory Reports

Reports shall include:

- Stock summary
- Stock register
- Stock movement
- Stock valuation
- Low-stock report

---

# 23. Search Requirements

## FR-160 — Global Search

The system shall provide global search.

Search targets:

- Customers
- Suppliers
- Products
- Sales invoices
- Purchase invoices
- Debit notes
- Credit notes
- Ledger accounts
- Transaction references

## FR-161 — Search Results

Search results shall provide enough information to identify and open the corresponding record.

---

# 24. Document Management

## FR-170 — Document Storage

The system shall support storage of documents related to transactions.

Suggested structure:

```text
Documents/
├── Sales/
├── Purchases/
├── DebitNotes/
└── CreditNotes/
```

## FR-171 — PDF Generation

The system shall be capable of generating:

- Sales invoices
- Purchase documents
- Ledger reports
- Stock reports
- Financial reports

---

# 25. Backup Requirements

## FR-180 — Manual Backup

The user shall be able to manually create a backup.

## FR-181 — Automatic Backup

The application should support automatic local backups.

## FR-182 — Backup Naming

Backups should contain a date/time identifier.

Example:

```text
SDL_ACC_2026-10-12_13-30.sqlite
```

## FR-183 — Restore

The user shall be able to restore a valid backup.

Before restoring, the system should create a backup of the current database.

## FR-184 — Database Verification

The system should verify database integrity before accepting a backup for restore.

---

# 26. USB / Portable Storage Requirements

## FR-190 — USB Database

The user shall be able to select a USB drive as the primary database location.

Example:

```text
E:\SDL_ACC\Data\company.sqlite
```

## FR-191 — USB Document Storage

Supporting documents may also be stored on the selected USB device.

## FR-192 — USB Detection

The system should detect whether the configured storage device is available.

## FR-193 — USB Disconnection

If the USB storage becomes unavailable, the system shall:

1. Stop unsafe write operations.
2. Notify the user.
3. Avoid corrupting the database.
4. Allow the user to reconnect the device or switch to a valid backup.

## FR-194 — Safe Eject

The system should provide a safe-eject workflow.

Before ejecting:

```text
Commit
↓
Flush
↓
Close Database
↓
Close Files
↓
Release Storage
↓
Safe to Remove
```

---

# 27. Settings

## FR-200 — Application Settings

The system shall provide settings for:

- Company
- Storage location
- Backup location
- Invoice numbering
- Currency
- Tax settings
- Appearance
- Security
- Printing
- Portable mode

---

# 28. Security Requirements

## FR-210 — Application Lock

The application should support an optional PIN/password lock.

## FR-211 — Password Storage

Passwords shall not be stored in plaintext.

## FR-212 — Local Security

Sensitive application configuration should be stored securely.

---

# 29. Non-Functional Requirements

## NFR-001 — Offline Operation

The core application shall function without internet access.

## NFR-002 — Performance

Common operations such as:

- Opening screens
- Searching records
- Loading ledgers
- Creating invoices
- Viewing stock

should respond quickly on a typical modern Windows computer.

## NFR-003 — Reliability

The application shall prioritize data integrity over speed when committing financial transactions.

## NFR-004 — Availability

The application should remain usable whenever the local database/storage is available.

## NFR-005 — Portability

The portable version should be capable of running from a compatible USB storage device.

## NFR-006 — Maintainability

The source code shall use modular architecture.

Business logic should not be tightly coupled to UI components.

## NFR-007 — Scalability

The system should support growth in:

- Products
- Customers
- Suppliers
- Transactions
- Ledger entries
- Financial years

without requiring an architectural rewrite.

## NFR-008 — Usability

The interface shall prioritize:

- Clear forms
- Readable tables
- Keyboard navigation
- Fast search
- Consistent controls
- Clear validation errors

## NFR-009 — Data Integrity

Financial and inventory updates shall be atomic.

## NFR-010 — Recovery

The application should provide mechanisms for backup and database recovery.

---

# 30. Data Validation Requirements

The application shall validate:

- Required fields
- Numeric values
- Dates
- Quantities
- Rates
- Discounts
- Tax values
- Account selections
- Product selection
- Customer/supplier selection

Invalid data shall not be posted.

Example:

```text
Quantity: -10
```

should be rejected unless the transaction type explicitly supports negative adjustments.

---

# 31. Money Handling

Financial values shall never rely on binary floating-point calculations.

The implementation should use:

- Decimal representation
- Integer minor units such as paise
- Or another exact monetary representation

Example:

```text
₹1,250.50
```

must not become:

```text
₹1,250.499999
```

---

# 32. Database Requirements

The initial database should contain entities similar to:

```text
companies
financial_years

customers
suppliers

products
product_categories
units

ledger_accounts
journal_entries
journal_lines

sales
sales_items

purchases
purchase_items

debit_notes
debit_note_items

credit_notes
credit_note_items

stock_transactions

payments
receipts
expenses

documents
backups
application_settings
```

The final schema shall be normalized and documented before production implementation.

---

# 33. Transaction Lifecycle

Every transaction should follow a controlled lifecycle.

```text
Draft
  ↓
Validated
  ↓
Posted
  ↓
Accounting + Inventory Updated
  ↓
Completed
```

A posted transaction should not be physically deleted without an appropriate accounting reversal/cancellation mechanism.

---

# 34. Audit Requirements

The system should maintain basic audit information such as:

- Created date
- Modified date
- Transaction status
- Reference number
- Cancellation reason
- Adjustment reason

For important financial operations, an audit trail should be retained.

---

# 35. Error Handling

The application shall provide understandable errors.

Example:

```text
DATABASE ERROR

SDL ACC could not access the selected database.

Possible reason:
The USB drive may have been disconnected.

Actions:
[Reconnect]
[Select Another Database]
[Open Backup]
[Exit]
```

Errors should not expose raw internal stack traces to normal users.

---

# 36. Logging

The application should maintain local diagnostic logs for:

- Startup errors
- Database errors
- Backup failures
- Restore failures
- USB/storage errors
- Unexpected application errors

Logs should not unnecessarily contain sensitive financial information.

---

# 37. Printing and Export

The system should support:

### PDF

- Invoices
- Ledgers
- Reports
- Stock reports

### CSV

- Sales
- Purchases
- Products
- Stock
- Ledger data

### Excel

- Sales reports
- Purchase reports
- Stock reports
- Financial reports

---

# 38. UI Requirements

The application should use a consistent desktop layout.

Suggested navigation:

```text
SDL ACC
│
├── Dashboard
├── Sales
├── Purchase
├── Inventory
├── Debit Note
├── Credit Note
├── Ledgers
├── Reports
├── Backup
└── Settings
```

Each major module should provide:

- List view
- Search
- Filter
- Create
- Edit
- View
- Print/export where applicable

---

# 39. Keyboard Requirements

The system should support keyboard-oriented accounting workflows.

Potential shortcuts:

```text
Ctrl + N    New
Ctrl + S    Save
Ctrl + F    Search
Ctrl + P    Print
Ctrl + B    Backup
Esc         Close
F2          Edit
F4          Party Selection
F8          Sales
F9          Purchase
```

Shortcut assignments may be finalized during implementation.

---

# 40. Installation Requirements

The application shall support installation on Windows.

The installer should:

1. Install SDL ACC.
2. Create application shortcuts.
3. Configure required application files.
4. Preserve user data during application updates where possible.

Application data should not be unnecessarily deleted during uninstall.

---

# 41. Portable Distribution

A portable build should have a structure similar to:

```text
SDL_ACC_PORTABLE/
│
├── SDL_ACC.exe
│
├── Data/
│   └── company.sqlite
│
├── Documents/
│
├── Backups/
│
└── Config/
```

The portable build should avoid requiring installation into Windows system directories.

---

# 42. Recovery Scenarios

The system shall account for:

## Scenario 1 — Application Crash

The database should remain consistent because financial operations use atomic transactions.

## Scenario 2 — USB Disconnection

The system should stop unsafe writes and alert the user.

## Scenario 3 — Power Failure

Committed transactions should remain intact.

## Scenario 4 — Corrupted Database

The user should be able to restore a verified backup.

## Scenario 5 — Application Update

User data should remain preserved.

---

# 43. Acceptance Criteria

SDL ACC V1 will be considered functionally complete when:

### Accounting

- [ ] Double-entry accounting works.
- [ ] Debit equals credit for every posted transaction.
- [ ] Ledger entries are generated automatically.
- [ ] Trial balance is generated correctly.

### Sales

- [ ] Sales invoices can be created.
- [ ] Sales invoices update customer balances.
- [ ] Sales invoices reduce stock.
- [ ] Sales reports work.

### Purchase

- [ ] Purchases can be recorded.
- [ ] Supplier balances are updated.
- [ ] Purchases increase stock.
- [ ] Purchase reports work.

### Inventory

- [ ] Current stock is calculated correctly.
- [ ] Stock movements are recorded.
- [ ] Low-stock products are identified.
- [ ] Stock reports work.

### Notes

- [ ] Debit notes work.
- [ ] Credit notes work.
- [ ] Related ledgers are updated.
- [ ] Related stock is updated where applicable.

### Reports

- [ ] Day Book works.
- [ ] Ledger works.
- [ ] Trial Balance works.
- [ ] Profit & Loss works.
- [ ] Balance Sheet works.
- [ ] Sales reports work.
- [ ] Purchase reports work.
- [ ] Stock reports work.

### Offline

- [ ] Application works without internet.
- [ ] Database works locally.
- [ ] Reports work offline.

### USB

- [ ] Database can be stored on USB.
- [ ] Documents can be stored on USB.
- [ ] USB disconnection is handled safely.
- [ ] Safe eject workflow works.

### Backup

- [ ] Manual backup works.
- [ ] Automatic backup works.
- [ ] Restore works.
- [ ] Database verification works.

---

# 44. Future Requirements

The following features are intentionally reserved for future versions:

## Version 2

- GST configuration
- HSN/SAC management
- Multiple companies
- Multiple financial years
- Bank reconciliation
- Advanced outstanding management
- Godowns
- Batch inventory
- Barcode support
- Advanced stock valuation

## Version 3

- OCR invoice scanning
- AI-powered transaction assistance
- Financial insights
- Automated anomaly detection
- Advanced analytics
- Optional cloud backup

These features shall not complicate the core offline architecture of V1.

---

# 45. Project Success Criteria

SDL ACC will be considered successful when it provides a stable and trustworthy workflow:

```text
CREATE MASTER
      ↓
CREATE TRANSACTION
      ↓
VALIDATE
      ↓
POST
      ↓
ACCOUNTING UPDATED
      ↓
INVENTORY UPDATED
      ↓
LEDGER UPDATED
      ↓
REPORTS UPDATED
      ↓
BACKUP AVAILABLE
```

The primary success metric is not the number of features. It is the **accuracy, reliability, recoverability, and usability of the accounting data**.

---

# 46. Final Requirement Statement

SDL ACC shall be developed as a:

> **Reliable, offline-first, Windows desktop accounting and inventory management system that integrates sales, purchases, stock, debit notes, credit notes, ledgers, accounting reports, document storage, backups, and USB portability through a local SQLite-based architecture.**

The system shall prioritize:

```text
DATA INTEGRITY
      ↓
ACCOUNTING ACCURACY
      ↓
OFFLINE OPERATION
      ↓
PORTABILITY
      ↓
BACKUP & RECOVERY
      ↓
DESKTOP USABILITY
      ↓
EXTENSIBILITY
```

---

# 47. Recommended V1 Development Order

```text
1. Tauri + React Setup
          ↓
2. SQLite + Migrations
          ↓
3. Company & Financial Year
          ↓
4. Ledger / Accounting Engine
          ↓
5. Customers & Suppliers
          ↓
6. Products & Inventory
          ↓
7. Sales
          ↓
8. Purchase
          ↓
9. Debit Notes
          ↓
10. Credit Notes
          ↓
11. Payments / Receipts
          ↓
12. Reports
          ↓
13. Dashboard
          ↓
14. Backup / Restore
          ↓
15. USB Portable Mode
          ↓
16. Testing
          ↓
17. Windows Installer
          ↓
18. SDL ACC V1 Release
```

---

**End of Software Requirements Specification**
