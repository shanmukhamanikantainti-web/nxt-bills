# SDL ACC — Security Architecture Design

**Project Name:** SDL ACC  
**Document Type:** Security Architecture Design  
**Version:** 1.0  
**Application Type:** Offline Windows Desktop Accounting & Inventory System  
**Architecture:** Tauri 2 + React + TypeScript + Rust + SQLite  
**Deployment:** Local Desktop / Portable USB  
**Primary Security Objective:** Protect accounting data, preserve transaction integrity, and prevent accidental or unauthorized modification.

---

# 1. Document Purpose

This document defines the security architecture for **SDL ACC**.

SDL ACC is an offline-first accounting application handling potentially sensitive business information such as:

- Sales
- Purchases
- Customers
- Suppliers
- Stock
- Payments
- Receipts
- Ledgers
- Financial reports
- Business documents
- Backups

Because the application is primarily local and may run from a USB device, security must focus heavily on:

1. Data integrity
2. Local access control
3. Database protection
4. Application integrity
5. File-system protection
6. Backup security
7. Portable-storage security
8. Transaction integrity
9. Recovery
10. Safe failure behavior

---

# 2. Security Philosophy

SDL ACC shall follow this principle:

> **Protect the data first, minimize privileges, validate every critical operation, and never trust the UI as the final security boundary.**

The security model shall be:

```text
USER
  ↓
AUTHENTICATION
  ↓
APPLICATION ACCESS
  ↓
TAURI SECURITY BOUNDARY
  ↓
RUST BUSINESS LOGIC
  ↓
AUTHORIZATION / VALIDATION
  ↓
DATABASE TRANSACTION
  ↓
AUDIT / INTEGRITY
  ↓
SECURE STORAGE
```

---

# 3. Security Objectives

SDL ACC security shall provide:

- Confidentiality where applicable
- Integrity of accounting records
- Availability of local data
- Controlled application access
- Secure transaction processing
- Secure file operations
- Secure backups
- Safe USB operation
- Protection against accidental deletion
- Protection against malformed input
- Protection against unauthorized application commands
- Reliable recovery

---

# 4. Threat Model

The application shall consider the following threat categories:

```text
┌──────────────────────────────────────┐
│            THREAT SOURCES            │
├──────────────────────────────────────┤
│ Unauthorized Local User              │
│ Malware                              │
│ Accidental User Action               │
│ USB Removal                          │
│ Database Corruption                  │
│ File Manipulation                    │
│ Malicious Input                      │
│ Application Bugs                     │
│ Dependency Vulnerabilities           │
│ Backup Theft                         │
│ Stolen Computer / USB                │
└──────────────────────────────────────┘
```

SDL ACC is not intended to protect against every possible compromise of a fully compromised Windows operating system.

If the host operating system is completely compromised by malware with administrator-level privileges, local application security cannot guarantee absolute protection.

---

# 5. Security Architecture

```text
┌────────────────────────────────────────────┐
│                 USER                       │
└────────────────────┬───────────────────────┘
                     ↓
┌────────────────────────────────────────────┐
│        SDL ACC Authentication              │
│        Optional PIN / Password              │
└────────────────────┬───────────────────────┘
                     ↓
┌────────────────────────────────────────────┐
│             React UI                       │
│        Untrusted Presentation Layer        │
└────────────────────┬───────────────────────┘
                     ↓
┌────────────────────────────────────────────┐
│             Tauri Boundary                 │
│       Controlled IPC / Commands             │
└────────────────────┬───────────────────────┘
                     ↓
┌────────────────────────────────────────────┐
│             Rust Core                      │
│                                            │
│ Authentication                            │
│ Authorization                             │
│ Validation                                │
│ Accounting Engine                         │
│ Inventory Engine                          │
│ File Manager                              │
│ Backup Manager                            │
└────────────────────┬───────────────────────┘
                     ↓
┌────────────────────────────────────────────┐
│             SQLite                         │
│       Transactional Data Store              │
└────────────────────┬───────────────────────┘
                     ↓
┌────────────────────────────────────────────┐
│ Local Disk / USB / Backup Storage          │
└────────────────────────────────────────────┘
```

---

# 6. Security Boundaries

SDL ACC shall contain several logical security boundaries.

## Boundary 1 — User

The user is not automatically trusted simply because they can interact with the UI.

## Boundary 2 — Frontend

The React application is treated as a presentation layer.

Critical business rules shall not rely exclusively on frontend validation.

## Boundary 3 — Tauri IPC

Only explicitly exposed commands should be callable by the frontend.

## Boundary 4 — Rust Core

Critical validation and business rules shall execute here.

## Boundary 5 — Database

SQLite shall enforce transactional consistency and appropriate constraints.

## Boundary 6 — File System

File access shall be restricted to intended application paths where possible.

---

# 7. Authentication Architecture

SDL ACC should support an optional local application lock.

Possible authentication:

```text
PIN
Password
```

Future options:

```text
Windows Hello
Biometric Authentication
```

---

# 8. Authentication Workflow

```text
Launch SDL ACC
      ↓
Authentication Required?
      ↓
YES
      ↓
Enter PIN / Password
      ↓
Validate Credential
      ↓
Valid?
   /       \
 YES       NO
  ↓         ↓
Dashboard  Reject
```

Repeated invalid authentication attempts may trigger a temporary lockout.

---

# 9. Password Security

If passwords are implemented:

- Never store plaintext passwords.
- Never store reversible passwords.
- Use a modern password hashing algorithm.
- Use a unique salt.
- Use an appropriate work factor.

Recommended:

> Argon2id

Example conceptual storage:

```text
password_hash
salt
algorithm
parameters
```

The plaintext password must never be written to:

- Database
- Logs
- Configuration files
- Crash reports

---

# 10. PIN Security

If a short PIN is supported, it must not be treated as equivalent to a strong password.

The system should:

- Store only a secure verifier/hash.
- Rate-limit attempts.
- Avoid logging PIN attempts.
- Provide a secure recovery process.

A PIN is intended primarily for local convenience, not high-assurance enterprise authentication.

---

# 11. Session Security

After successful authentication:

```text
Authenticated Session
        ↓
Application Access
        ↓
Idle Timeout
        ↓
Lock Application
```

The application may support configurable idle locking.

Example:

```text
5 minutes
10 minutes
15 minutes
30 minutes
Never
```

---

# 12. Authorization Architecture

Although SDL ACC is primarily single-user, authorization should still exist at the service layer.

Example conceptual permissions:

```text
VIEW_DATA
CREATE_TRANSACTION
EDIT_DRAFT
POST_TRANSACTION
CANCEL_TRANSACTION
MANAGE_MASTERS
VIEW_REPORTS
BACKUP
RESTORE
CHANGE_SETTINGS
```

Critical actions such as restore and financial-year operations may require additional confirmation.

---

# 13. Frontend Security

The React frontend shall be considered untrusted for business-critical operations.

Frontend validation is useful for:

- User experience
- Immediate feedback
- Form correctness

But final validation shall occur in Rust.

Example:

```text
React:
Quantity > 0

        ↓

Rust:
Quantity > 0
Product exists
Stock rules satisfied
Transaction valid
Accounting rules satisfied

        ↓

SQLite
```

---

# 14. Tauri Security Architecture

The Tauri layer shall use a minimal permission model.

The application should expose only the commands required by the frontend.

Avoid exposing unrestricted native operations.

Examples of commands:

```text
create_sale
create_purchase
get_customer
get_supplier
get_stock
create_payment
create_receipt
create_debit_note
create_credit_note
generate_report
create_backup
restore_backup
```

Avoid generic commands such as:

```text
execute_arbitrary_command
write_any_file
run_shell_command
```

---

# 15. Command Validation

Every Tauri command shall validate:

1. Authentication state
2. Authorization
3. Input structure
4. Business rules
5. File paths where applicable
6. Database state

Only after validation should the command perform the requested operation.

---

# 16. IPC Security

Communication between React and Rust should use controlled Tauri IPC.

The frontend shall not receive unnecessary native capabilities.

Sensitive data should be returned only when required.

Errors returned to the frontend should be safe and user-readable.

---

# 17. Input Validation

All user-controlled input must be treated as untrusted.

Inputs include:

- Customer names
- Supplier names
- Product names
- Invoice numbers
- Quantities
- Prices
- Notes
- Search terms
- File names
- Paths
- Report filters

Validation shall occur before processing or storage.

---

# 18. SQL Injection Protection

Database queries shall use parameterized queries.

Avoid:

```text
SELECT * FROM customers WHERE name = '<user input>'
```

Prefer parameterized queries supported by the selected database library.

Conceptually:

```text
SELECT *
FROM customers
WHERE name = ?
```

with the user input bound as a parameter.

---

# 19. Path Traversal Protection

User-controlled filenames and paths must never be blindly concatenated.

Dangerous example:

```text
../../secret.txt
```

The application shall normalize and validate paths before file operations.

The application should restrict document and backup paths to approved directories where practical.

---

# 20. File Name Security

Generated filenames should be sanitized.

Example:

```text
Invoice: INV/2026/001
```

should not become an invalid or dangerous filesystem path.

Safe representation:

```text
INV-2026-001.pdf
```

---

# 21. Database Security

SQLite shall be protected through:

- File permissions
- Controlled access
- Transactions
- Integrity checks
- Backup
- Optional encryption

The database should not be directly exposed through a network service.

---

# 22. SQLite Encryption

Encryption is optional for V1 but recommended when the database contains sensitive financial data.

Possible future implementation:

> SQLCipher-compatible SQLite encryption

If database encryption is enabled:

```text
Application
    ↓
Authentication / Key Derivation
    ↓
Database Key
    ↓
Encrypted SQLite
```

The encryption key must not be hardcoded into the application binary.

---

# 23. Encryption Key Management

If encryption is implemented, keys shall not be stored as:

```text
const DB_PASSWORD = "..."
```

Keys should be derived or protected using a secure mechanism.

Possible Windows mechanism:

> Windows Credential Manager / DPAPI

For portable USB mode, key-management design requires special consideration because the application and encrypted database may move together.

---

# 24. Portable Mode Security

USB portability creates additional risks.

Threats include:

- Lost USB
- Stolen USB
- USB malware
- File copying
- Database theft
- Accidental removal
- File corruption

Recommended protection:

```text
USB
 ↓
Encrypted Database
 ↓
Application Authentication
 ↓
Controlled Access
```

For highly sensitive financial data, database encryption should be strongly considered.

---

# 25. USB Disconnection Security

If the USB disappears:

```text
USB Removal
     ↓
Detect I/O Failure
     ↓
Block New Writes
     ↓
Rollback Active Transaction
     ↓
Notify User
     ↓
Do Not Continue Blindly
```

The application shall not repeatedly retry writes indefinitely.

---

# 26. Safe Eject Security Workflow

```text
User Requests Eject
       ↓
Check Active Transactions
       ↓
Finish / Block New Transactions
       ↓
Commit
       ↓
Flush Database
       ↓
Flush Files
       ↓
Close Database
       ↓
Release Handles
       ↓
Confirm Safe Removal
```

---

# 27. Accounting Integrity Security

Financial integrity is a primary security requirement.

Every posted voucher shall satisfy:

```text
TOTAL DEBIT = TOTAL CREDIT
```

The system must reject:

```text
Debit ≠ Credit
```

before commit.

---

# 28. Atomic Financial Transactions

Sales, purchases, notes, payments, receipts, and relevant adjustments must use atomic database transactions.

Example:

```text
BEGIN
    Create Invoice
    Create Invoice Items
    Create Journal
    Create Journal Lines
    Create Stock Transaction
    Update Related Balances
COMMIT
```

If anything fails:

```text
ROLLBACK
```

---

# 29. Inventory Integrity

Stock must be traceable.

The system should avoid directly changing the final stock number without recording the underlying movement.

Preferred:

```text
Sale
 ↓
Stock OUT Transaction
 ↓
Calculated Stock
```

rather than:

```text
Sale
 ↓
stock = stock - quantity
```

with no history.

---

# 30. Ledger Integrity

Ledger balances should be derived from journal entries.

```text
Business Transaction
      ↓
Journal Entry
      ↓
Journal Lines
      ↓
Ledger Balance
```

The application should not independently maintain conflicting copies of financial truth.

---

# 31. Transaction Immutability

Once a financial transaction is posted, it should not be freely edited.

Preferred workflow:

```text
Posted Transaction
       ↓
Cancel / Reverse
       ↓
Create Reversal
       ↓
Preserve Original
```

This improves auditability.

---

# 32. Draft Security

Draft transactions may be edited.

```text
DRAFT
 ↓
EDIT
 ↓
VALIDATE
 ↓
POST
```

Drafts should not affect official:

- Ledgers
- Trial balance
- Profit & loss
- Balance sheet
- Stock reports

unless explicitly configured.

---

# 33. Audit Trail

SDL ACC should maintain audit information for important operations.

Audit events may include:

- Login
- Logout
- Failed login
- Transaction creation
- Transaction posting
- Transaction cancellation
- Stock adjustment
- Backup
- Restore
- Settings changes
- Financial-year changes

---

# 34. Audit Record Structure

Conceptually:

```text
audit_log
├── id
├── timestamp
├── action
├── entity_type
├── entity_id
├── result
└── metadata
```

Sensitive authentication secrets must not be stored in audit metadata.

---

# 35. Audit Log Integrity

Audit logs should preferably be append-oriented.

Normal users should not be able to casually modify historical audit records through the UI.

Deletion of audit information should be restricted or avoided.

---

# 36. Backup Security

Backups contain the same sensitive information as the database.

Therefore:

> A backup must be treated as sensitive data.

Backups should be stored in controlled locations.

---

# 37. Backup Encryption

For sensitive deployments, encrypted backups are recommended.

Possible workflow:

```text
SQLite Database
      ↓
Backup
      ↓
Compress if required
      ↓
Encrypt
      ↓
Store Backup
```

The encryption key must be protected separately from the backup file.

---

# 38. Backup Integrity

Every backup should be verified.

Recommended:

```text
Create Backup
     ↓
Verify File Exists
     ↓
Verify File Size
     ↓
Open / Integrity Check
     ↓
Mark Backup Valid
```

Optional stronger verification:

```text
Backup
 ↓
Cryptographic Hash
 ↓
Store Hash
```

---

# 39. Restore Security

Restore is a privileged operation.

Workflow:

```text
Authenticate
      ↓
Confirm Restore
      ↓
Validate Backup
      ↓
Create Current-DB Safety Backup
      ↓
Close Database
      ↓
Restore
      ↓
Integrity Check
      ↓
Open
```

The application should never overwrite the active database with an unverified file.

---

# 40. Malware Considerations

SDL ACC should not execute arbitrary files from USB storage.

The application should never automatically execute:

- `.exe`
- `.bat`
- `.cmd`
- `.ps1`
- `.vbs`
- Other executable scripts

from user-controlled document locations.

Document folders should be treated as data storage only.

---

# 41. Windows Permissions

The application should follow least privilege.

Normal operations should not require:

```text
Administrator privileges
```

Avoid writing application data into protected system directories when user-level storage is sufficient.

---

# 42. Secrets Management

SDL ACC should avoid storing secrets in:

```text
Source code
Frontend JavaScript
Plaintext configuration
Logs
Database records
```

If secrets are required, use appropriate OS-level secure storage.

---

# 43. Dependency Security

Development dependencies must be reviewed regularly.

Recommended practices:

```text
Lock dependency versions
        ↓
Review vulnerabilities
        ↓
Update dependencies deliberately
        ↓
Test
        ↓
Release
```

Avoid adding unnecessary dependencies.

---

# 44. Supply Chain Security

The build process should use:

- Locked dependency versions
- Trusted package registries
- Verified source repositories
- Reproducible builds where practical
- Review of new dependencies

Build artifacts should be generated from controlled source code.

---

# 45. Application Update Security

Updates should be obtained only from trusted sources.

The application should not blindly execute arbitrary downloaded updates.

Future update infrastructure should consider:

- Digital signatures
- HTTPS
- Version verification
- Signature verification
- Rollback

---

# 46. Code Signing

A production Windows build should ideally be code-signed.

Benefits include:

- Better user trust
- Reduced SmartScreen friction
- Publisher identity
- Improved software integrity

Code-signing certificates must be protected securely.

---

# 47. Error Handling Security

Technical errors should be separated from user-facing messages.

Instead of exposing:

```text
SQLite stack trace
filesystem internals
Rust panic details
```

the UI should show:

```text
SDL ACC could not save the transaction.

The operation was rolled back.
No accounting changes were committed.

Please try again.
```

Detailed diagnostics may be stored locally in logs.

---

# 48. Logging Security

Logs must not contain:

- Passwords
- PINs
- Encryption keys
- Authentication tokens
- Sensitive credentials

Financial information should be logged only when necessary for diagnostics.

---

# 49. Crash Handling

If the application crashes during a transaction:

```text
Crash
 ↓
SQLite Transaction Not Committed
 ↓
Rollback on Recovery
 ↓
Database Reopens
 ↓
Integrity Check
```

SQLite's transactional behavior shall be used to protect committed data.

---

# 50. Denial-of-Service Considerations

Because SDL ACC is local, traditional network denial-of-service is not a primary threat.

However, the application should protect against:

- Extremely large input
- Huge report ranges
- Excessively large file imports
- Repeated expensive queries
- Malformed database data

Pagination and query limits should be used where appropriate.

---

# 51. Resource Limits

The application should impose reasonable limits on:

- Text field length
- Import file size
- Document size
- Report result size
- Search input length

This reduces memory and performance risks.

---

# 52. Secure Search

Search fields shall be:

- Parameterized
- Length-limited
- Safely escaped where required for display
- Protected against injection

---

# 53. Import Security

If CSV/XLSX import is implemented:

```text
Select File
   ↓
Validate Extension
   ↓
Validate File Size
   ↓
Parse Safely
   ↓
Validate Columns
   ↓
Validate Data
   ↓
Preview
   ↓
User Confirmation
   ↓
Database Transaction
```

Import should not directly insert unvalidated records.

---

# 54. Export Security

Exported reports may contain sensitive information.

The user should be warned that:

```text
PDF / CSV / XLSX
```

files may contain financial data.

Exports should be written only to the selected destination.

---

# 55. PDF Security

Generated PDFs should not automatically contain:

- Hidden secrets
- Database credentials
- Internal file paths
- Debug information

Only business-relevant information should be included.

---

# 56. Clipboard Security

If copy-to-clipboard is supported for sensitive information, the application should consider clearing sensitive clipboard contents after a reasonable period where appropriate.

This is optional and should not interfere with normal user workflows.

---

# 57. Screen Security

SDL ACC may optionally support:

- Application lock
- Automatic lock after inactivity
- Hide sensitive dashboard values
- Re-authentication for high-risk actions

---

# 58. High-Risk Operations

The following operations should require strong confirmation:

```text
Database Restore
Delete / Archive Master
Cancel Posted Transaction
Stock Adjustment
Financial Year Close
Change Storage Location
Change Security Settings
Reset Authentication
```

For especially destructive actions:

```text
Confirm
+
Reason
```

may be required.

---

# 59. Data Deletion Policy

SDL ACC should avoid immediate destructive deletion of important financial data.

Preferred:

```text
Active
 ↓
Inactive / Archived
```

For financial transactions:

```text
Posted
 ↓
Cancelled / Reversed
```

rather than:

```text
DELETE
```

---

# 60. Data Retention

The user should control retention of:

- Transactions
- Documents
- Backups
- Logs

Financial records should not be automatically deleted simply to save disk space.

---

# 61. Security of Configuration

Application configuration should be separated into:

```text
Non-sensitive configuration
```

and:

```text
Sensitive configuration
```

Sensitive values should use secure storage where necessary.

---

# 62. Secure Storage Layout

Recommended:

```text
SDL_ACC/
├── Application/
│
├── Data/
│   └── company.sqlite
│
├── Documents/
│
├── Backups/
│
├── Logs/
│
└── Config/
```

Permissions should be appropriate for the Windows user account.

---

# 63. Database File Access

The SQLite file should normally be accessed only by SDL ACC.

Other applications should not need direct access.

For encrypted databases, unauthorized direct access should result in unreadable database contents.

---

# 64. Portable USB Threat Model

USB mode should assume:

```text
USB Can Be Lost
USB Can Be Copied
USB Can Be Corrupted
USB Can Be Removed
USB Can Be Infected
```

Therefore:

```text
USB Portability
      +
Authentication
      +
Database Encryption
      +
Backups
```

provides stronger protection than portability alone.

---

# 65. Recommended USB Security Configuration

For sensitive financial information:

```text
High-quality USB / Portable SSD
        ↓
exFAT / NTFS
        ↓
Encrypted SDL ACC Database
        ↓
Application Authentication
        ↓
Encrypted Backups
        ↓
Separate Recovery Backup
```

---

# 66. Offline Security Model

SDL ACC does not need an internet-facing API.

This significantly reduces exposure to:

- Remote attacks
- API attacks
- Network scanning
- Server exploitation
- Cloud credential theft

However, offline does not mean automatically secure.

Local threats remain important.

---

# 67. No Backend Server Requirement

SDL ACC V1 shall not expose:

```text
HTTP Server
REST API
Public Port
Database Port
WebSocket Server
```

unless a future feature explicitly requires one.

This minimizes the network attack surface.

---

# 68. Security Monitoring

SDL ACC should provide local security-relevant information such as:

```text
Last Backup
Database Status
Storage Status
Last Restore
Application Version
```

A simple security/health panel may show:

```text
Database: Healthy
Last Backup: Today
Backup Verified: Yes
Storage: Available
Application: Up to Date
```

---

# 69. Security Health Check

The application may provide:

```text
Security Health
      ↓
Authentication Enabled?
      ↓
Database Healthy?
      ↓
Recent Backup?
      ↓
Backup Verified?
      ↓
Storage Available?
      ↓
Application Version Valid?
```

---

# 70. Secure Development Lifecycle

SDL ACC development should follow:

```text
Requirements
    ↓
Threat Modeling
    ↓
Architecture
    ↓
Implementation
    ↓
Security Review
    ↓
Testing
    ↓
Dependency Review
    ↓
Build
    ↓
Code Signing
    ↓
Release
```

---

# 71. Security Testing

Security testing should include:

### Authentication

- Correct password
- Incorrect password
- Repeated failures
- Lockout
- Session timeout

### Authorization

- Unauthorized command invocation
- Restricted operation attempts
- Restore access
- Settings access

### Input

- Empty input
- Very large input
- Special characters
- Invalid numeric values
- Malicious path values
- SQL injection attempts

### Database

- Corrupted database
- Interrupted transaction
- Invalid migration
- Restore invalid backup

### USB

- Disconnect during read
- Disconnect during write
- Reconnect
- Wrong drive
- Missing database

---

# 72. Security Acceptance Criteria

SDL ACC security implementation shall be considered acceptable when:

- [ ] Authentication works if enabled.
- [ ] Password/PIN secrets are never stored in plaintext.
- [ ] Frontend cannot bypass Rust validation.
- [ ] Tauri commands use controlled permissions.
- [ ] SQL queries are parameterized.
- [ ] File paths are validated.
- [ ] Posted transactions cannot be silently altered.
- [ ] Accounting transactions are atomic.
- [ ] Debit always equals credit.
- [ ] Inventory movements are traceable.
- [ ] Restore requires explicit confirmation.
- [ ] Backups are validated.
- [ ] USB removal is handled safely.
- [ ] Sensitive information is excluded from logs.
- [ ] Production builds can be code-signed.
- [ ] No unnecessary network services are exposed.
- [ ] Dependencies are reviewed.
- [ ] Security-critical failures fail safely.

---

# 73. Security Incident Recovery

If suspicious activity or data corruption is detected:

```text
Detect
  ↓
Stop Further Writes
  ↓
Preserve Current Data
  ↓
Create Forensic / Safety Copy if Appropriate
  ↓
Assess Database Integrity
  ↓
Identify Last Valid Backup
  ↓
Restore
  ↓
Verify
  ↓
Resume
```

For serious malware incidents, the host Windows system should also be scanned and secured before restoring sensitive data.

---

# 74. Security Priorities

SDL ACC security priorities are:

```text
1. Accounting Integrity
2. Database Integrity
3. Authentication
4. Authorization
5. Backup & Recovery
6. Portable Storage Security
7. File Security
8. Application Integrity
9. Dependency Security
10. Confidentiality Enhancements
```

---

# 75. Recommended V1 Security Scope

V1 should definitely implement:

```text
✓ Local Authentication Option
✓ Secure Password/PIN Storage
✓ Rust-Side Validation
✓ Parameterized SQL
✓ Atomic Transactions
✓ Database Constraints
✓ Controlled Tauri Commands
✓ Safe File Paths
✓ Backup
✓ Backup Verification
✓ Restore Confirmation
✓ Database Integrity Checks
✓ USB Disconnect Handling
✓ Safe Eject
✓ Audit Information
✓ Secure Error Handling
✓ No Network Server
```

---

# 76. Recommended V2 Security Scope

Future security improvements:

```text
□ SQLCipher Database Encryption
□ Encrypted Backups
□ Windows Credential Manager / DPAPI
□ Windows Hello
□ Advanced Audit Log
□ Digital Code Signing
□ Signed Application Updates
□ Advanced Permission Profiles
□ Tamper-Evident Audit Records
```

---

# 77. Security Architecture Summary

```text
                       USER
                         │
                         ▼
                ┌─────────────────┐
                │ Authentication  │
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │    React UI     │
                │  Untrusted Edge │
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │ Tauri IPC Layer │
                │ Limited Commands│
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │    Rust Core    │
                │ Validation      │
                │ Authorization   │
                │ Business Rules  │
                └────────┬────────┘
                         ▼
                ┌─────────────────┐
                │ SQLite Database │
                │ ACID Transactions│
                └────────┬────────┘
                         ▼
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Documents       Backups       Reports
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  Local / USB Storage
```

---

# 78. Final Security Principle

SDL ACC should follow:

> **Never trust the UI, never partially commit financial transactions, never silently delete accounting history, never expose unnecessary native capabilities, and never assume that a USB drive is secure simply because it is local.**

The application should be designed so that even when a user makes an accidental mistake, the system favors:

```text
VALIDATION
   ↓
SAFE FAILURE
   ↓
ROLLBACK
   ↓
RECOVERY
```

over:

```text
PARTIAL WRITE
   ↓
CORRUPTED DATA
   ↓
UNTRACEABLE ACCOUNTING
```

The final security architecture therefore combines:

```text
Authentication
      +
Least Privilege
      +
Input Validation
      +
Tauri Isolation
      +
Rust-Side Business Rules
      +
SQLite Transactions
      +
Auditability
      +
Backup
      +
Recovery
      +
USB Safety
      +
Optional Encryption
```

to provide a robust offline security foundation for SDL ACC.

---

**End of Security Architecture Design**
