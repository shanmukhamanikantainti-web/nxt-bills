# SDL ACC — Overall System Workflow

**Project Name:** SDL ACC  
**Document Type:** Overall Workflow Specification  
**Version:** 1.0  
**Application:** Offline Desktop Accounting & Inventory Management System  
**Platform:** Windows Desktop  
**Architecture:** Tauri 2 + React + TypeScript + Rust + SQLite  
**Primary Storage:** Local Disk / USB / Pendrive

---

# 1. Document Purpose

This document defines the complete end-to-end workflow of **SDL ACC**, from application startup and company setup through master-data creation, transactions, accounting, inventory updates, reports, backup, recovery, and application shutdown.

The purpose of this document is to ensure that every major SDL ACC module follows a predictable and connected workflow.

The central principle is:

```text
INPUT
  ↓
VALIDATION
  ↓
TRANSACTION
  ↓
ACCOUNTING
  ↓
INVENTORY
  ↓
LEDGER
  ↓
REPORTS
  ↓
BACKUP
```

---

# 2. Overall System Architecture

```text
                         ┌──────────────────────┐
                         │       USER           │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    SDL ACC UI        │
                         │ React + TypeScript   │
                         └──────────┬───────────┘
                                    │
                             Tauri Commands
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     RUST CORE        │
                         │                      │
                         │ Accounting Engine    │
                         │ Inventory Engine     │
                         │ Report Engine        │
                         │ Backup Engine        │
                         │ File Manager         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       SQLITE         │
                         │    Local Database    │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    ▼               ▼                ▼
                Documents        Backups        Reports/Exports
                    │               │                │
                    └───────────────┼────────────────┘
                                    ▼
                             Local / USB Storage
```

---

# 3. Application Startup Workflow

When SDL ACC is launched:

```text
Launch SDL ACC
      ↓
Initialize Tauri
      ↓
Load Application Configuration
      ↓
Determine Storage Mode
      ↓
Check Database Location
      ↓
Check Database Availability
      ↓
Run Database Integrity Check
      ↓
Check Pending Migrations
      ↓
Run Required Migrations
      ↓
Load Company / Financial Year
      ↓
Initialize Application Services
      ↓
Load Dashboard
```

If any critical initialization fails:

```text
Initialization Failure
        ↓
Display Error
        ↓
Identify Problem
        ↓
Reconnect / Select Database / Restore Backup / Exit
```

---

# 4. First-Time Setup Workflow

When SDL ACC is opened for the first time:

```text
Launch
  ↓
No Database Found
  ↓
First-Time Setup
  ↓
Select Storage Location
  ↓
Create Database
  ↓
Create Company
  ↓
Configure Financial Year
  ↓
Configure Currency
  ↓
Configure Invoice Numbering
  ↓
Create Default Ledger Accounts
  ↓
Configure Backup Location
  ↓
Finish Setup
  ↓
Dashboard
```

---

# 5. Storage Mode Selection

SDL ACC shall support two primary storage modes.

## 5.1 Local Mode

```text
Windows PC
    ↓
SDL ACC
    ↓
Local Data Directory
    ↓
SQLite Database
```

Example:

```text
C:\Users\<User>\Documents\SDL_ACC\
```

## 5.2 Portable USB Mode

```text
USB Drive
    ↓
SDL_ACC\
    ├── SDL_ACC.exe
    ├── Data\
    ├── Documents\
    ├── Backups\
    └── Config\
```

The application should determine the portable root dynamically instead of depending on a fixed drive letter.

---

# 6. Dashboard Workflow

After successful startup:

```text
Dashboard
   │
   ├── Sales Summary
   ├── Purchase Summary
   ├── Stock Summary
   ├── Receivables
   ├── Payables
   ├── Low Stock
   ├── Recent Transactions
   └── Quick Actions
```

Quick actions may include:

```text
New Sale
New Purchase
New Customer
New Supplier
New Product
New Payment
New Receipt
New Debit Note
New Credit Note
Backup
```

---

# 7. Master Data Workflow

Master data must generally exist before business transactions are posted.

```text
Company
  ↓
Financial Year
  ↓
Customers / Suppliers
  ↓
Product Categories
  ↓
Units
  ↓
Products
  ↓
Ledger Accounts
```

---

# 8. Customer Workflow

```text
Open Customers
      ↓
Create Customer
      ↓
Enter Details
      ↓
Validate
      ↓
Save Customer
      ↓
Customer Available for Sales
      ↓
Transactions Accumulate
      ↓
Customer Ledger Updated
```

Customer lifecycle:

```text
Created
  ↓
Active
  ↓
Transactions
  ↓
Outstanding Balance
  ↓
Inactive / Archived
```

---

# 9. Supplier Workflow

```text
Open Suppliers
      ↓
Create Supplier
      ↓
Enter Details
      ↓
Validate
      ↓
Save Supplier
      ↓
Supplier Available for Purchases
      ↓
Transactions Accumulate
      ↓
Supplier Ledger Updated
```

---

# 10. Product Workflow

```text
Create Category
      ↓
Create Unit
      ↓
Create Product
      ↓
Set Purchase Price
      ↓
Set Selling Price
      ↓
Set Tax Information
      ↓
Set Opening Stock
      ↓
Set Reorder Level
      ↓
Save Product
      ↓
Product Available in Transactions
```

---

# 11. Opening Stock Workflow

Opening stock shall be recorded through a controlled initialization process.

```text
Create Product
      ↓
Enter Opening Quantity
      ↓
Enter Opening Rate / Valuation
      ↓
Validate
      ↓
Create Opening Stock Transaction
      ↓
Create Corresponding Accounting Entry
      ↓
Stock Available
```

Opening stock must not simply be inserted into a display field without an underlying stock transaction.

---

# 12. Sales Workflow

## 12.1 Standard Sales Flow

```text
New Sale
   ↓
Select Customer
   ↓
Select Product
   ↓
Enter Quantity
   ↓
Check Stock
   ↓
Enter Rate
   ↓
Apply Discount
   ↓
Calculate Tax
   ↓
Calculate Invoice Total
   ↓
Select Payment Type
   ↓
Validate Invoice
   ↓
Preview
   ↓
Post Sale
   ↓
Accounting Transaction
   ↓
Customer Ledger Update
   ↓
Stock OUT
   ↓
Sales Register Update
   ↓
Invoice Saved
   ↓
PDF / Print
```

---

# 13. Sales Validation Workflow

Before posting a sale:

```text
Customer Valid?
     ↓ Yes
Product Valid?
     ↓ Yes
Quantity Valid?
     ↓ Yes
Stock Available?
     ↓ Yes
Rate Valid?
     ↓ Yes
Discount Valid?
     ↓ Yes
Tax Valid?
     ↓ Yes
Invoice Total Correct?
     ↓ Yes
Accounting Entry Balanced?
     ↓ Yes
POST
```

If any validation fails:

```text
Reject Posting
     ↓
Show Error
     ↓
Correct Data
     ↓
Validate Again
```

---

# 14. Sales Accounting Workflow

A typical credit sale can conceptually produce:

```text
Customer A/C       DR
      ↓
      Sales A/C             CR
      Tax A/C               CR
```

The exact accounts depend on configured accounting rules.

The transaction must satisfy:

```text
Total Debit = Total Credit
```

---

# 15. Sales Inventory Workflow

For a product sale:

```text
Sales Invoice
      ↓
Validate Stock
      ↓
Stock OUT
      ↓
Update Stock Transaction
      ↓
Recalculate Current Stock
      ↓
Update Stock Reports
```

Conceptually:

```text
Closing Stock
=
Opening Stock
+ Purchases
+ Other Stock IN
- Sales
- Returns OUT
± Adjustments
```

---

# 16. Cash Sale Workflow

For a cash sale:

```text
Create Sale
   ↓
Select Cash
   ↓
Validate
   ↓
Post
   ↓
Sales Account Updated
   ↓
Cash Account Updated
   ↓
Stock Reduced
   ↓
Invoice Completed
```

---

# 17. Credit Sale Workflow

For a credit sale:

```text
Create Sale
   ↓
Select Customer
   ↓
Payment = Credit
   ↓
Post
   ↓
Customer Receivable Increased
   ↓
Sales Account Updated
   ↓
Stock Reduced
   ↓
Invoice Completed
```

---

# 18. Purchase Workflow

## 18.1 Standard Purchase Flow

```text
New Purchase
   ↓
Select Supplier
   ↓
Select Product
   ↓
Enter Quantity
   ↓
Enter Purchase Rate
   ↓
Apply Discount
   ↓
Calculate Tax
   ↓
Calculate Total
   ↓
Select Payment Type
   ↓
Validate
   ↓
Post Purchase
   ↓
Accounting Transaction
   ↓
Supplier Ledger Update
   ↓
Stock IN
   ↓
Purchase Register Update
   ↓
Document Saved
```

---

# 19. Purchase Inventory Workflow

```text
Purchase Invoice
      ↓
Validate
      ↓
Stock IN
      ↓
Create Stock Transaction
      ↓
Update Current Stock
      ↓
Update Stock Reports
```

---

# 20. Purchase Accounting Workflow

A typical credit purchase can conceptually produce:

```text
Purchase / Inventory A/C     DR
Tax Input A/C                DR
      ↓
      Supplier A/C                 CR
```

The exact accounts depend on the accounting configuration.

---

# 21. Payment Workflow

Payments represent money going out.

```text
New Payment
     ↓
Select Payee / Account
     ↓
Enter Amount
     ↓
Select Payment Mode
     ↓
Enter Reference
     ↓
Validate
     ↓
Post Payment
     ↓
Cash/Bank Reduced
     ↓
Relevant Ledger Updated
     ↓
Outstanding Reduced
```

Example:

```text
Supplier A/C      DR
      Cash/Bank         CR
```

---

# 22. Receipt Workflow

Receipts represent money coming in.

```text
New Receipt
     ↓
Select Customer / Source
     ↓
Enter Amount
     ↓
Select Receipt Mode
     ↓
Enter Reference
     ↓
Validate
     ↓
Post Receipt
     ↓
Cash/Bank Increased
     ↓
Customer Ledger Updated
     ↓
Outstanding Reduced
```

Example:

```text
Cash/Bank         DR
      Customer A/C      CR
```

---

# 23. Debit Note Workflow

```text
New Debit Note
      ↓
Select Supplier
      ↓
Select Original Purchase
      ↓
Select Returned / Adjusted Items
      ↓
Enter Quantity / Amount
      ↓
Enter Reason
      ↓
Validate
      ↓
Post Debit Note
      ↓
Supplier Ledger Adjustment
      ↓
Purchase Adjustment
      ↓
Stock OUT if applicable
      ↓
Accounting Updated
      ↓
Document Saved
```

---

# 24. Credit Note Workflow

```text
New Credit Note
      ↓
Select Customer
      ↓
Select Original Sale
      ↓
Select Returned / Adjusted Items
      ↓
Enter Quantity / Amount
      ↓
Enter Reason
      ↓
Validate
      ↓
Post Credit Note
      ↓
Customer Ledger Adjustment
      ↓
Sales Adjustment
      ↓
Stock IN if applicable
      ↓
Accounting Updated
      ↓
Document Saved
```

---

# 25. Stock Adjustment Workflow

Manual stock changes must be controlled.

```text
Stock Adjustment
      ↓
Select Product
      ↓
View Current Stock
      ↓
Enter Adjustment
      ↓
Select IN / OUT
      ↓
Enter Reason
      ↓
Validate
      ↓
Post Adjustment
      ↓
Create Stock Transaction
      ↓
Update Inventory
      ↓
Create Accounting Entry if Required
```

Every manual adjustment should have a reason.

---

# 26. Inventory Monitoring Workflow

```text
Open Inventory
      ↓
View Stock Summary
      ↓
Select Product
      ↓
View Stock Movement
      ↓
Opening Stock
      +
Purchases
      +
Stock IN
      -
Sales
      -
Stock OUT
      ±
Adjustments
      ↓
Current Stock
```

---

# 27. Low Stock Workflow

```text
Current Stock
      ↓
Compare with Reorder Level
      ↓
Current Stock <= Reorder Level?
      ↓
YES
      ↓
Add to Low Stock List
      ↓
Display Dashboard Alert
```

---

# 28. Customer Outstanding Workflow

```text
Sales on Credit
      ↓
Customer Receivable
      ↓
Customer Ledger
      ↓
Payment / Receipt
      ↓
Outstanding Reduced
      ↓
Current Balance
```

Customer statement:

```text
Opening Balance
+ Credit Sales
+ Debit Adjustments
- Receipts
- Credit Adjustments
= Closing Balance
```

The exact sign convention shall follow the configured ledger model.

---

# 29. Supplier Outstanding Workflow

```text
Credit Purchase
      ↓
Supplier Payable
      ↓
Supplier Ledger
      ↓
Payment
      ↓
Outstanding Reduced
      ↓
Current Balance
```

---

# 30. Ledger Workflow

Every posted financial transaction contributes to one or more ledgers.

```text
Business Transaction
       ↓
Accounting Engine
       ↓
Journal Entry
       ↓
Journal Lines
       ↓
Ledger Accounts
       ↓
Ledger Balance
```

Ledger data shall be derived from posted accounting entries rather than manually maintained separately.

---

# 31. Double-Entry Validation Workflow

Every journal posting shall follow:

```text
Create Journal
      ↓
Generate Debit Lines
      ↓
Generate Credit Lines
      ↓
Calculate Total Debit
      ↓
Calculate Total Credit
      ↓
Compare
      ↓
Debit == Credit?
      ↓
YES → POST
NO  → REJECT
```

Never post an unbalanced transaction.

---

# 32. Atomic Transaction Workflow

Financial transactions should follow:

```text
BEGIN TRANSACTION
       ↓
Validate Business Rules
       ↓
Create Primary Transaction
       ↓
Create Accounting Entries
       ↓
Update Ledger
       ↓
Update Inventory
       ↓
Create References
       ↓
Validate Final State
       ↓
COMMIT
```

If an error occurs:

```text
ERROR
  ↓
ROLLBACK
  ↓
No Partial Transaction
```

---

# 33. Example: Complete Sales Transaction

A sale of 5 units demonstrates the full system workflow.

```text
User creates invoice
        ↓
Customer selected
        ↓
Product selected
        ↓
Quantity = 5
        ↓
Stock checked
        ↓
Price calculated
        ↓
Tax/discount calculated
        ↓
Invoice total calculated
        ↓
Validation
        ↓
BEGIN TRANSACTION
        ↓
Sales record created
        ↓
Sales item created
        ↓
Journal entry created
        ↓
Customer ledger updated
        ↓
Stock OUT created
        ↓
Stock balance updated
        ↓
COMMIT
        ↓
Invoice number finalized
        ↓
Invoice available for print/PDF
        ↓
Dashboard updated
        ↓
Reports updated
```

---

# 34. Example: Complete Purchase Transaction

```text
User creates purchase
        ↓
Supplier selected
        ↓
Product selected
        ↓
Quantity entered
        ↓
Purchase price entered
        ↓
Tax/discount calculated
        ↓
Validation
        ↓
BEGIN TRANSACTION
        ↓
Purchase record created
        ↓
Purchase item created
        ↓
Journal entry created
        ↓
Supplier ledger updated
        ↓
Stock IN created
        ↓
Stock balance updated
        ↓
COMMIT
        ↓
Purchase document saved
        ↓
Dashboard updated
        ↓
Reports updated
```

---

# 35. Reporting Workflow

Reports shall use posted data.

```text
User Opens Reports
       ↓
Select Report
       ↓
Select Date Range
       ↓
Select Filters
       ↓
Query SQLite
       ↓
Process Results
       ↓
Calculate Report
       ↓
Display Report
       ↓
Export / Print
```

---

# 36. Sales Report Workflow

```text
Reports
  ↓
Sales
  ↓
Select Date Range
  ↓
Optional Customer/Product Filter
  ↓
Fetch Posted Sales
  ↓
Calculate Totals
  ↓
Display
  ↓
Export / Print
```

---

# 37. Purchase Report Workflow

```text
Reports
  ↓
Purchases
  ↓
Select Date Range
  ↓
Optional Supplier/Product Filter
  ↓
Fetch Posted Purchases
  ↓
Calculate Totals
  ↓
Display
  ↓
Export / Print
```

---

# 38. Stock Report Workflow

```text
Reports
  ↓
Inventory
  ↓
Select Product / Category
  ↓
Select Date Range
  ↓
Fetch Stock Transactions
  ↓
Calculate Movement
  ↓
Calculate Closing Stock
  ↓
Display
  ↓
Export / Print
```

---

# 39. Ledger Report Workflow

```text
Reports
  ↓
Ledger
  ↓
Select Account
  ↓
Select Date Range
  ↓
Fetch Journal Lines
  ↓
Calculate Running Balance
  ↓
Display
  ↓
Export / Print
```

---

# 40. Trial Balance Workflow

```text
All Posted Journal Entries
          ↓
Group by Ledger Account
          ↓
Calculate Debit Totals
          ↓
Calculate Credit Totals
          ↓
Generate Trial Balance
          ↓
Verify
          ↓
Total Debit = Total Credit
```

If the totals do not match, the system should flag a serious accounting integrity issue.

---

# 41. Profit & Loss Workflow

Conceptually:

```text
Posted Transactions
       ↓
Identify Revenue
       ↓
Identify Cost / Expenses
       ↓
Calculate Period Totals
       ↓
Gross / Net Result
       ↓
Generate P&L
```

---

# 42. Balance Sheet Workflow

Conceptually:

```text
Posted Accounting Data
       ↓
Assets
Liabilities
Capital
       ↓
Calculate Closing Balances
       ↓
Generate Balance Sheet
```

The report shall use the accounting engine's posted data.

---

# 43. Dashboard Refresh Workflow

The dashboard should not independently maintain financial truth.

```text
Database
   ↓
Posted Transactions
   ↓
Aggregations / Queries
   ↓
Dashboard Metrics
   ↓
Charts / Cards
```

Examples:

```text
Today's Sales
Monthly Sales
Receivables
Payables
Stock Value
Low Stock
Recent Transactions
```

---

# 44. Search Workflow

```text
User enters search
       ↓
Search Type Identified
       ↓
Query Indexed Fields
       ↓
Return Matching Records
       ↓
Display Results
       ↓
Open Selected Record
```

Search should remain responsive for large datasets.

---

# 45. Document Workflow

For an invoice or report:

```text
Transaction / Report
       ↓
Generate Document Data
       ↓
Apply Template
       ↓
Generate PDF
       ↓
Save to Documents/
       ↓
Open / Print / Share Locally
```

Example:

```text
Documents/
└── Sales/
    └── INV-2026-001.pdf
```

---

# 46. Backup Workflow

## Manual Backup

```text
User selects Backup
       ↓
Validate Database
       ↓
Commit Pending Operations
       ↓
Create Backup
       ↓
Verify Backup
       ↓
Store Backup
       ↓
Display Success
```

Example:

```text
Backups/
└── SDL_ACC_2026-10-12_13-30.sqlite
```

---

# 47. Automatic Backup Workflow

If automatic backup is enabled:

```text
Backup Schedule
       ↓
Check Application State
       ↓
Ensure No Critical Transaction Running
       ↓
Create Backup
       ↓
Verify Backup
       ↓
Store Backup
       ↓
Apply Retention Policy
```

---

# 48. Restore Workflow

Restoration must be treated as a high-risk operation.

```text
User selects Restore
       ↓
Select Backup
       ↓
Validate Backup
       ↓
Create Safety Backup of Current Database
       ↓
Close Active Database Operations
       ↓
Restore Selected Backup
       ↓
Run Integrity Check
       ↓
Run Required Migrations
       ↓
Reopen Database
       ↓
Verify Company Data
       ↓
Return to Dashboard
```

---

# 49. USB Connection Workflow

```text
USB Connected
      ↓
Windows Detects Device
      ↓
SDL ACC Detects Storage
      ↓
Check SDL ACC Folder
      ↓
Check Database
      ↓
Open Portable Environment
```

If the database is unavailable:

```text
Database Not Found
      ↓
Ask User:
[Create New]
[Select Database]
[Restore Backup]
[Cancel]
```

---

# 50. USB Disconnection Workflow

If the USB is removed while SDL ACC is running:

```text
USB Removal Detected
        ↓
Block New Writes
        ↓
Notify User
        ↓
Stop Unsafe Operations
        ↓
Attempt Safe Recovery
        ↓
Reconnect USB?
      /       \
    YES        NO
     ↓          ↓
Resume       Switch / Exit
```

The application should never silently continue writing to an unavailable path.

---

# 51. Safe Eject Workflow

```text
User clicks Safe Eject
       ↓
Check Active Transactions
       ↓
Wait for Transaction Completion
       ↓
Commit Pending Changes
       ↓
Flush Database
       ↓
Flush Files
       ↓
Close Database
       ↓
Release File Handles
       ↓
Confirm Safe Removal
```

---

# 52. Application Shutdown Workflow

Normal shutdown:

```text
User Closes SDL ACC
       ↓
Check Unsaved Changes
       ↓
Save / Discard Prompt if Required
       ↓
Complete Pending Operations
       ↓
Commit Database
       ↓
Close Database
       ↓
Release Files
       ↓
Write Final State
       ↓
Close Tauri
       ↓
Exit
```

---

# 53. Crash Recovery Workflow

```text
Application Crash
       ↓
Restart SDL ACC
       ↓
Open Database
       ↓
Run Integrity Check
       ↓
Check Incomplete Operations
       ↓
Recover / Roll Back as Supported
       ↓
Validate Database
       ↓
Load Dashboard
```

---

# 54. Database Integrity Workflow

SDL ACC should periodically or manually perform:

```text
Database
   ↓
Integrity Check
   ↓
Schema Check
   ↓
Migration Check
   ↓
Accounting Balance Check
   ↓
Inventory Consistency Check
   ↓
Report Result
```

---

# 55. Accounting Integrity Workflow

The application should provide internal validation:

```text
Journal Entries
      ↓
For Each Voucher
      ↓
Debit = Credit?
      ↓
YES → Valid
NO  → Integrity Warning
```

---

# 56. Inventory Integrity Workflow

The application may verify:

```text
Opening Stock
+ Stock IN
- Stock OUT
± Adjustments
=
Calculated Stock
```

The calculated value should agree with the stored/current inventory representation.

---

# 57. Data Lifecycle

Every major business record follows:

```text
CREATE
  ↓
VALIDATE
  ↓
SAVE / DRAFT
  ↓
POST
  ↓
ACCOUNTING / INVENTORY EFFECT
  ↓
REPORTING
  ↓
CANCEL / REVERSE IF REQUIRED
  ↓
ARCHIVE
```

Posted financial records should not simply be hard-deleted.

---

# 58. Transaction Status Workflow

Recommended states:

```text
DRAFT
  ↓
VALIDATED
  ↓
POSTED
  ↓
COMPLETED
```

Possible exception:

```text
POSTED
  ↓
CANCELLED / REVERSED
```

The system should maintain the original transaction reference.

---

# 59. Cancellation Workflow

```text
Open Posted Transaction
       ↓
Request Cancellation
       ↓
Confirm Reason
       ↓
Validate Cancellation Rules
       ↓
Create Reversal / Cancellation Record
       ↓
Reverse Accounting Effect
       ↓
Reverse Inventory Effect if Applicable
       ↓
Mark Original Transaction Cancelled
       ↓
Update Reports
```

The preferred approach is reversal rather than destructive deletion.

---

# 60. Financial Year Workflow

```text
Create Financial Year
       ↓
Set Start Date
       ↓
Set End Date
       ↓
Configure Opening Balances
       ↓
Use for Transactions
       ↓
Generate Reports
       ↓
Close Financial Year
       ↓
Carry Forward Balances if Required
```

Financial-year closing should be implemented carefully because it affects accounting continuity.

---

# 61. Master Data Dependency Workflow

The dependency order should be:

```text
Company
  ↓
Financial Year
  ↓
Ledger Accounts
  ↓
Customers / Suppliers
  ↓
Categories / Units
  ↓
Products
  ↓
Transactions
  ↓
Reports
```

A transaction should not be allowed to reference nonexistent master data.

---

# 62. Complete Business Cycle

The complete accounting cycle can be represented as:

```text
MASTER SETUP
     ↓
CUSTOMER / SUPPLIER / PRODUCT
     ↓
PURCHASE
     ↓
STOCK IN
     ↓
SALES
     ↓
STOCK OUT
     ↓
RECEIVABLE / PAYABLE
     ↓
PAYMENT / RECEIPT
     ↓
LEDGER
     ↓
REPORTS
     ↓
BACKUP
```

---

# 63. Complete Sales-to-Cash Cycle

```text
Customer
   ↓
Sales Invoice
   ↓
Receivable
   ↓
Customer Ledger
   ↓
Receipt
   ↓
Cash / Bank
   ↓
Receivable Reduced
```

---

# 64. Complete Purchase-to-Payment Cycle

```text
Supplier
   ↓
Purchase Invoice
   ↓
Payable
   ↓
Supplier Ledger
   ↓
Payment
   ↓
Cash / Bank
   ↓
Payable Reduced
```

---

# 65. Complete Inventory Cycle

```text
Opening Stock
      ↓
Purchases
      ↓
Stock IN
      ↓
Available Stock
      ↓
Sales
      ↓
Stock OUT
      ↓
Returns / Adjustments
      ↓
Closing Stock
      ↓
Stock Report
```

---

# 66. Credit Note Inventory Cycle

For a customer return:

```text
Original Sale
      ↓
Customer Returns Goods
      ↓
Credit Note
      ↓
Stock IN
      ↓
Customer Balance Adjusted
      ↓
Sales Reversal / Adjustment
      ↓
Reports Updated
```

---

# 67. Debit Note Inventory Cycle

For a supplier return:

```text
Original Purchase
      ↓
Return Goods to Supplier
      ↓
Debit Note
      ↓
Stock OUT
      ↓
Supplier Balance Adjusted
      ↓
Purchase Reversal / Adjustment
      ↓
Reports Updated
```

---

# 68. Error Workflow

Every major error should follow:

```text
Error Detected
      ↓
Stop Unsafe Operation
      ↓
Rollback if Transaction Active
      ↓
Log Technical Error
      ↓
Show User-Friendly Message
      ↓
Provide Recovery Action
```

---

# 69. Validation Workflow

All important forms should use:

```text
Input
  ↓
Required Field Validation
  ↓
Format Validation
  ↓
Business Rule Validation
  ↓
Database Validation
  ↓
Accounting Validation
  ↓
Post
```

---

# 70. UI-to-Core Workflow

The frontend should not directly manipulate accounting truth.

Recommended:

```text
React UI
   ↓
Form Data
   ↓
Validation
   ↓
Tauri Command
   ↓
Rust Service
   ↓
Business Rules
   ↓
SQLite Transaction
   ↓
Result
   ↓
React UI Update
```

---

# 71. Example Tauri Command Flow

Conceptually:

```text
React:
create_sale(data)

        ↓

Tauri Command:
create_sale()

        ↓

Rust:
SalesService::create()

        ↓

Validate

        ↓

AccountingService

        ↓

InventoryService

        ↓

SQLite Transaction

        ↓

Result

        ↓

React refreshes UI
```

---

# 72. Frontend State Workflow

The frontend should distinguish between:

```text
Server/Database State
```

and:

```text
Temporary UI State
```

For example:

```text
Invoice Form
    ↓
Draft UI State
    ↓
User clicks Post
    ↓
Backend transaction
    ↓
Database becomes source of truth
    ↓
UI refreshes from database
```

---

# 73. Report Source-of-Truth Workflow

Reports should be generated from posted accounting and inventory records.

```text
User Interface
      ↓
Report Query
      ↓
Posted Database Records
      ↓
Aggregation
      ↓
Report
```

Draft transactions should not affect official financial reports unless explicitly designed to do so.

---

# 74. Search-to-Transaction Workflow

```text
Global Search
      ↓
Find Invoice
      ↓
Open Invoice
      ↓
View Details
      ↓
View Ledger Effect
      ↓
View Stock Effect
      ↓
Print / Export / Cancel
```

---

# 75. Backup-to-Recovery Workflow

```text
Normal Operation
      ↓
Automatic / Manual Backup
      ↓
Verified Backup
      ↓
Database Failure
      ↓
Select Valid Backup
      ↓
Safety Backup
      ↓
Restore
      ↓
Integrity Check
      ↓
Resume Operation
```

---

# 76. End-of-Day Workflow

A practical daily workflow:

```text
Start SDL ACC
      ↓
Review Dashboard
      ↓
Enter Sales
      ↓
Enter Purchases
      ↓
Record Payments
      ↓
Record Receipts
      ↓
Handle Returns / Notes
      ↓
Check Stock
      ↓
Review Outstanding
      ↓
Review Ledger
      ↓
Generate Daily Report
      ↓
Create Backup
      ↓
Close Application
```

---

# 77. Month-End Workflow

```text
Review Sales
      ↓
Review Purchases
      ↓
Review Receivables
      ↓
Review Payables
      ↓
Check Stock
      ↓
Check Stock Adjustments
      ↓
Review Ledger
      ↓
Generate Trial Balance
      ↓
Generate Profit & Loss
      ↓
Generate Balance Sheet
      ↓
Create Full Backup
```

---

# 78. Year-End Workflow

Year-end processing should be controlled:

```text
Complete Transactions
      ↓
Verify Sales
      ↓
Verify Purchases
      ↓
Verify Stock
      ↓
Verify Receivables
      ↓
Verify Payables
      ↓
Verify Ledger
      ↓
Trial Balance
      ↓
Profit & Loss
      ↓
Balance Sheet
      ↓
Full Backup
      ↓
Close Financial Year
      ↓
Carry Forward Opening Balances
      ↓
Create New Financial Year
```

---

# 79. Security Workflow

If application lock is enabled:

```text
Launch SDL ACC
      ↓
Authentication Screen
      ↓
Enter PIN / Password
      ↓
Validate Credentials
      ↓
Success → Dashboard
Failure → Access Denied
```

Credentials shall never be stored in plaintext.

---

# 80. File Storage Workflow

```text
Transaction
    ↓
Document Generated
    ↓
Determine Storage Root
    ↓
Determine Module Folder
    ↓
Generate Safe Filename
    ↓
Write File
    ↓
Verify File
    ↓
Save Document Reference in Database
```

The database should retain the document reference/path rather than relying only on a filename displayed in the UI.

---

# 81. Application Update Workflow

```text
New SDL ACC Version
       ↓
Check Current Version
       ↓
Create Database Backup
       ↓
Install Application Update
       ↓
Run Database Migrations
       ↓
Validate Database
       ↓
Launch New Version
       ↓
Verify Data
```

User data must remain separate from application binaries.

---

# 82. Overall Data Flow

```text
                   USER INPUT
                       │
                       ▼
                ┌──────────────┐
                │  React UI    │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │   Tauri      │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │  Rust Core   │
                └──────┬───────┘
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
       Accounting   Inventory   Files
             │         │         │
             └─────────┼─────────┘
                       ▼
                  ┌─────────┐
                  │ SQLite  │
                  └────┬────┘
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
       Ledgers       Reports      Dashboard
          │            │             │
          └────────────┼─────────────┘
                       ▼
                  Backup / Export
```

---

# 83. SDL ACC Core Principle

The most important workflow rule is:

```text
ONE BUSINESS TRANSACTION
        ↓
ONE VALIDATED OPERATION
        ↓
ACCOUNTING EFFECT
        +
INVENTORY EFFECT
        +
LEDGER EFFECT
        ↓
ONE ATOMIC DATABASE TRANSACTION
```

This prevents inconsistent states.

---

# 84. Final End-to-End Workflow

The complete SDL ACC lifecycle is:

```text
┌───────────────────────┐
│       START APP       │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│  LOAD STORAGE / DB    │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ COMPANY + FY SETUP    │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│    MASTER DATA        │
│ Customers             │
│ Suppliers             │
│ Products              │
│ Ledgers               │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│     TRANSACTIONS      │
│ Sales                 │
│ Purchases             │
│ Payments              │
│ Receipts              │
│ Debit Notes           │
│ Credit Notes          │
│ Adjustments           │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│    VALIDATION         │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ ACCOUNTING ENGINE     │
│ Debit = Credit        │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│   INVENTORY ENGINE    │
│ Stock IN / OUT        │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│    LEDGER ENGINE      │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│     SQLITE COMMIT     │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ DASHBOARD + REPORTS   │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│ PDF / CSV / XLSX      │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│       BACKUP          │
└───────────┬───────────┘
            ↓
┌───────────────────────┐
│     SAFE SHUTDOWN     │
└───────────────────────┘
```

---

# 85. Final Architecture Workflow

```text
                    SDL ACC
                       │
          ┌────────────┴────────────┐
          │                         │
      Local Mode                USB Mode
          │                         │
          └────────────┬────────────┘
                       ↓
                 Tauri Desktop
                       ↓
                 React + TS UI
                       ↓
                 Tauri Commands
                       ↓
                   Rust Core
                       │
        ┌──────────────┼───────────────┐
        │              │               │
        ▼              ▼               ▼
   Accounting      Inventory        File System
        │              │               │
        └──────────────┼───────────────┘
                       ↓
                    SQLite
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
    Ledgers          Reports         Dashboard
       │               │                │
       └───────────────┼────────────────┘
                       ↓
               Backup / Recovery
                       ↓
                Local / USB Storage
```

---

# 86. Engineering Rules

The following rules should guide the entire implementation:

1. **Database is the source of truth.**
2. **Posted transactions are never silently deleted.**
3. **Every accounting voucher must balance.**
4. **Accounting and inventory updates must be atomic.**
5. **Draft data must not affect official reports.**
6. **Stock must be traceable through stock transactions.**
7. **Ledger balances must derive from journal entries.**
8. **Money must use exact decimal-safe representation.**
9. **USB disconnection must be handled safely.**
10. **Backups must be verifiable.**
11. **Application updates must preserve user data.**
12. **The core application must work completely offline.**
13. **Business logic should remain independent of the UI.**
14. **Critical operations should be testable independently.**
15. **The system should favor data integrity over convenience.**

---

# 87. Final Workflow Definition

SDL ACC is fundamentally a closed-loop local accounting system:

```text
MASTER DATA
     ↓
BUSINESS TRANSACTION
     ↓
VALIDATION
     ↓
ACCOUNTING
     ↓
INVENTORY
     ↓
LEDGER
     ↓
REPORTING
     ↓
DOCUMENTATION
     ↓
BACKUP
     ↓
RECOVERY
```

The complete product should behave as one integrated system rather than as independent modules.

A sales transaction should automatically affect every relevant subsystem. A purchase should automatically affect inventory and supplier accounting. Returns should reverse the appropriate effects. Reports should derive from posted data. Backups should protect the same database that powers the entire application.

The result should be a reliable offline desktop accounting environment that remains simple to deploy while maintaining strict accounting and inventory integrity.

---

**End of Overall Workflow Specification**
