# SDL ACC — System Requirements Specification

**Project Name:** SDL ACC  
**Document Type:** System Requirements Specification  
**Version:** 1.0  
**Target Platform:** Microsoft Windows 10/11 64-bit  
**Application Type:** Offline Desktop Accounting & Inventory Application  
**Primary Architecture:** Tauri 2 + React + TypeScript + Rust + SQLite  
**Primary Deployment Mode:** Local Desktop / Portable USB  
**Network Requirement:** Not required for core functionality

---

# 1. Purpose

This document defines the hardware, operating system, software, runtime, storage, security, deployment, development, and operational requirements required to build and run **SDL ACC**.

SDL ACC is designed as a local-first accounting and inventory application. The system must remain functional without an internet connection and should support storing application data on local storage or a USB/pendrive.

---

# 2. System Overview

SDL ACC shall operate as a native-feeling Windows desktop application.

```text
┌─────────────────────────────────────┐
│             Windows OS              │
│                                     │
│  ┌───────────────────────────────┐  │
│  │          SDL ACC              │  │
│  │                               │  │
│  │ React + TypeScript UI         │  │
│  │ Tauri 2 Desktop Runtime       │  │
│  │ Rust Application Core         │  │
│  │ SQLite Database               │  │
│  └───────────────────────────────┘  │
│                                     │
│ Local Disk / USB Storage            │
└─────────────────────────────────────┘
```

The system shall not depend on a continuously running backend server for normal operation.

---

# 3. Supported Operating Systems

## 3.1 Primary Operating System

SDL ACC shall target:

- Windows 11 64-bit
- Windows 10 64-bit

## 3.2 Recommended OS

Recommended:

> Windows 11 64-bit with current security and system updates.

## 3.3 Unsupported Environments

The following are outside the initial V1 target:

- Windows 32-bit
- Windows XP
- Windows Vista
- Windows 7
- Windows 8/8.1
- macOS
- Linux
- Android
- iOS

Cross-platform support may be considered in a future version.

---

# 4. Minimum Hardware Requirements

The following represents the minimum practical configuration for SDL ACC.

| Component | Minimum Requirement |
|---|---|
| CPU | Dual-core 64-bit processor |
| CPU Architecture | x64 |
| RAM | 4 GB |
| Storage | 2 GB free space |
| Display | 1280 × 720 |
| Graphics | Integrated graphics |
| USB | USB 2.0 or newer for portable mode |
| Keyboard | Standard keyboard |
| Mouse | Standard mouse/touchpad |
| Internet | Not required |

SDL ACC is primarily a data-processing application and does not require a dedicated GPU.

---

# 5. Recommended Hardware Requirements

For a smoother experience:

| Component | Recommended |
|---|---|
| CPU | Intel Core i3 / AMD Ryzen 3 or better |
| RAM | 8 GB or more |
| Storage | SSD |
| Free Storage | 10 GB or more |
| Display | 1920 × 1080 |
| Graphics | Integrated GPU is sufficient |
| USB | USB 3.0 or newer |
| Storage Device | High-quality SSD/USB flash drive |

---

# 6. High-Performance Development Machine

The following configuration is recommended for development:

| Component | Recommended Development Requirement |
|---|---|
| CPU | Intel Core i5 / Ryzen 5 or better |
| RAM | 16 GB |
| Storage | 512 GB SSD or greater |
| GPU | Integrated GPU or dedicated GPU |
| Display | 1920 × 1080 or greater |
| OS | Windows 11 64-bit |
| Internet | Required for development dependencies |

A dedicated GPU is not required for SDL ACC itself.

---

# 7. Storage Requirements

## 7.1 Application Storage

The installed application should normally occupy only a small amount of storage.

Expected initial application footprint:

```text
Application:
~100 MB – 500 MB
```

Actual size depends on bundled runtime components and future features.

## 7.2 Database Storage

SQLite database size depends on transaction volume.

Example:

```text
SDL_ACC/
└── Data/
    └── company.sqlite
```

The system shall support a growing local database without requiring a server.

## 7.3 Document Storage

Documents may be stored separately:

```text
SDL_ACC/
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

# 8. USB / Pendrive Requirements

SDL ACC shall support portable storage.

## 8.1 Minimum USB Requirement

USB 2.0 shall be technically supported.

## 8.2 Recommended USB

USB 3.0 or newer is recommended.

## 8.3 Recommended USB Storage

For reliable operation:

- 16 GB minimum
- 32 GB recommended
- 64 GB or greater for long-term document storage

## 8.4 File System

Recommended:

> exFAT

NTFS may also be supported.

FAT32 may be supported for compatibility, but its 4 GB individual-file limitation should be considered for large backups or documents.

---

# 9. Portable Application Requirements

A portable SDL ACC deployment may use:

```text
E:\SDL_ACC\
│
├── SDL_ACC.exe
│
├── Data\
│   └── company.sqlite
│
├── Documents\
│
├── Backups\
│
└── Config\
```

The application shall determine its portable data directory dynamically.

The portable build shall avoid hardcoding a specific drive letter such as:

```text
E:\
```

Instead, it should resolve the current executable/storage location.

---

# 10. Database Requirements

## 10.1 Database Engine

SDL ACC shall use:

> SQLite

## 10.2 Database Characteristics

SQLite shall provide:

- Local storage
- Transaction support
- ACID behavior
- No external database server
- Offline operation
- Low resource usage
- Easy backup
- Portable database file

## 10.3 Database File

Example:

```text
company.sqlite
```

## 10.4 Database Transactions

Critical operations shall use database transactions.

Example:

```text
BEGIN TRANSACTION

Validate Transaction
Create Invoice
Create Journal Entries
Update Ledger
Update Stock
Commit

OR

ROLLBACK
```

---

# 11. Database Access Layer

The Rust layer shall communicate with SQLite through a suitable Rust database library.

Possible implementation:

```text
SQLx
```

or:

```text
rusqlite
```

The final implementation shall use one database access strategy consistently.

---

# 12. Frontend Requirements

## 12.1 Framework

The frontend shall use:

> React

## 12.2 Language

The frontend shall use:

> TypeScript

## 12.3 Build Tool

The project shall use:

> Vite

## 12.4 UI Styling

Recommended:

> Tailwind CSS

## 12.5 UI Components

Recommended:

> shadcn/ui

## 12.6 Charts

Recommended:

> Recharts

Charts should be used for dashboard analytics and reports where useful.

---

# 13. Desktop Framework Requirements

SDL ACC shall use:

> Tauri 2

Tauri shall provide:

- Windows desktop application packaging
- Native application integration
- Secure frontend/backend communication
- File system access
- Application lifecycle management
- Native dialogs
- Portable desktop execution

---

# 14. Native Application Requirements

The native layer shall use:

> Rust

Rust shall handle operations such as:

- Database access
- Accounting calculations
- Inventory operations
- File management
- Backup
- Restore
- USB/storage handling
- Native dialogs
- Application-level validation
- Critical business operations

Business-critical logic should not depend entirely on frontend JavaScript.

---

# 15. Runtime Requirements

The end user's system should not require separate installation of:

- Node.js
- npm
- Rust
- Python
- SQLite CLI
- PostgreSQL
- Docker

These are development/build dependencies, not end-user requirements.

The required runtime components shall be bundled or handled by the application package.

---

# 16. Development Environment Requirements

Developers building SDL ACC shall have:

### Required

- Windows 10/11 64-bit
- Node.js LTS
- npm
- Rust toolchain
- Cargo
- Tauri CLI
- Git

### Recommended

- Visual Studio Code or compatible IDE
- GitHub/Git repository
- SQLite database inspection tool

---

# 17. Node.js Requirements

The development environment shall use a supported Node.js LTS version.

Recommended:

> Node.js 20 LTS or newer supported LTS release.

The production application shall not require Node.js to be installed.

---

# 18. Rust Requirements

The development environment shall contain:

- Rust toolchain
- Cargo
- Rust compiler
- Tauri CLI

Recommended installation channel:

> rustup

The production application shall contain the compiled native binary rather than requiring Rust on the user's machine.

---

# 19. Package Management

The frontend dependency manager may use:

- npm
- pnpm
- yarn

Recommended:

> npm

The project should maintain a lock file to ensure reproducible builds.

---

# 20. Network Requirements

## 20.1 Production

Internet:

> Not required.

SDL ACC shall be able to perform its core accounting, inventory, reporting, backup, and document-management functions offline.

## 20.2 Development

Internet may be required for:

- Installing dependencies
- Updating packages
- Downloading Rust crates
- Downloading Tauri components
- Accessing documentation
- Git operations

Once dependencies are installed, development can continue with limited or no internet depending on the workflow.

---

# 21. Network Independence

The following must not require an online connection:

- Application startup
- Company management
- Customer management
- Supplier management
- Product management
- Sales
- Purchases
- Inventory
- Debit notes
- Credit notes
- Ledgers
- Reports
- PDF generation
- Local exports
- Backup
- Restore

---

# 22. Optional External Hardware

SDL ACC may interact with:

- Printers
- USB storage devices
- Barcode scanners
- External keyboards
- External monitors

These are optional.

---

# 23. Printer Requirements

If invoice/report printing is required, SDL ACC shall use the Windows printing subsystem.

Supported printer types may include:

- Inkjet
- Laser
- Thermal receipt printer
- Network printer configured in Windows

The initial version does not require a specific printer brand.

---

# 24. Barcode Scanner Requirements

Future barcode support may use standard USB HID barcode scanners.

Such scanners generally behave like keyboard input devices.

No specialized driver should be required where the scanner supports standard HID keyboard mode.

---

# 25. Display Requirements

## Minimum

```text
1280 × 720
```

## Recommended

```text
1920 × 1080
```

The UI should support:

- Window resizing
- Maximized mode
- Standard Windows scaling
- High-DPI displays

---

# 26. High-DPI Requirements

The application shall remain readable under common Windows scaling configurations:

- 100%
- 125%
- 150%
- 175%
- 200%

UI components should avoid fixed pixel layouts that break under scaling.

---

# 27. Memory Requirements

SDL ACC should be designed to operate efficiently.

Target behavior:

- Low idle memory usage
- Efficient database queries
- Paginated large tables
- No unnecessary loading of complete transaction history
- Controlled caching

Large reports should not load unlimited records into frontend memory.

---

# 28. CPU Requirements

Normal accounting operations should require minimal CPU resources.

CPU-intensive operations may include:

- Large report generation
- PDF generation
- Database backup
- Database integrity checks
- Large data exports

These operations should avoid blocking the user interface.

---

# 29. File System Requirements

SDL ACC requires access to:

- Application directory
- Database directory
- Backup directory
- Document directory
- Temporary working directory

The application should gracefully handle permission errors.

---

# 30. File Permissions

The application shall not require administrator privileges for normal operation.

Installation may require administrator permission depending on the selected installation location.

Portable mode should preferably run without administrator privileges.

---

# 31. Windows Security Requirements

The application should be compatible with:

- Windows Defender
- Windows Firewall
- Windows User Account Control
- Windows SmartScreen

The production build should ideally use code signing to reduce security warnings.

---

# 32. Data Security Requirements

The application shall protect important local data against accidental loss.

Required mechanisms:

- Database transactions
- Backup
- Restore
- Database integrity checking
- Controlled file operations
- Safe shutdown
- USB disconnect handling

Optional future protection:

- Encrypted database
- Application PIN
- Encrypted backup
- Secure credential storage

---

# 33. Backup Storage Requirements

Backups may be stored on:

```text
Local Disk
USB Drive
External Drive
```

Recommended structure:

```text
Backups/
├── Daily/
├── Weekly/
└── Manual/
```

The exact policy can be configured later.

---

# 34. Backup Capacity

The required backup capacity depends on database and document size.

Recommended:

```text
Minimum free space:
5 GB

Recommended:
20 GB+
```

Users storing many PDFs or scanned documents may require substantially more storage.

---

# 35. Recovery Requirements

The system should support recovery from:

- Application crash
- Unexpected shutdown
- Power failure
- USB disconnection
- Database corruption
- Accidental data modification

Recovery shall prioritize the most recent valid backup.

---

# 36. Data Integrity Requirements

The system shall maintain:

```text
Accounting Integrity
+
Inventory Integrity
+
Database Integrity
+
File Integrity
```

A transaction should never result in:

```text
Ledger Updated
but
Stock Not Updated
```

or:

```text
Stock Updated
but
Ledger Not Updated
```

for the same atomic business operation.

---

# 37. Performance Requirements

The following are target requirements rather than absolute hardware guarantees.

| Operation | Target |
|---|---|
| Application startup | ≤ 5 seconds on recommended hardware |
| Normal screen navigation | ≤ 1 second |
| Common search | ≤ 1 second |
| Invoice creation | Near-instant UI response |
| Transaction posting | ≤ 2 seconds under normal load |
| Standard report generation | ≤ 5 seconds |
| Backup | Dependent on database size |
| Large export | Dependent on record count |

Performance shall be validated using realistic transaction volumes.

---

# 38. Scalability Requirements

The application should support at least:

- 100,000+ ledger entries
- 100,000+ sales records
- 100,000+ purchase records
- 10,000+ products
- 10,000+ customers
- 10,000+ suppliers

The final supported limits shall be determined through performance testing.

---

# 39. Database Indexing

Indexes should be created for frequently searched fields.

Examples:

```text
invoice_number
transaction_date
customer_id
supplier_id
product_id
sku
ledger_account_id
voucher_type
```

Indexes shall be evaluated based on actual query patterns.

---

# 40. Software Dependencies — Production

The production system should minimize external dependencies.

Expected architecture:

```text
SDL ACC.exe
    ↓
Tauri Runtime
    ↓
Rust Application
    ↓
SQLite
```

The end user should not need to manually install a database server.

---

# 41. Software Dependencies — Development

Development dependencies may include:

```text
Node.js
npm
React
TypeScript
Vite
Tailwind CSS
shadcn/ui
Recharts
Tauri CLI
Rust
Cargo
SQLx / rusqlite
Git
```

Additional libraries may be introduced only when they provide clear value.

---

# 42. Build Requirements

The application build system shall produce:

### Installer

```text
SDL_ACC_Setup.exe
```

### Portable Build

```text
SDL_ACC_Portable/
```

The exact installer format may be selected according to Tauri's supported Windows packaging options.

---

# 43. Build Architecture

Development:

```text
Source Code
    ↓
Vite Build
    ↓
React Frontend
    ↓
Tauri Build
    ↓
Rust Compilation
    ↓
Windows Application
```

---

# 44. Versioning Requirements

SDL ACC should use semantic-style versioning:

```text
MAJOR.MINOR.PATCH
```

Example:

```text
1.0.0
1.1.0
1.1.1
2.0.0
```

---

# 45. Update Requirements

Future updates should preserve user data.

The update system should distinguish between:

```text
Application Files
```

and:

```text
User Data
```

Application updates must not overwrite the active SQLite database without explicit migration logic.

---

# 46. Database Migration Requirements

Schema changes shall use versioned migrations.

Example:

```text
Migration 001
Migration 002
Migration 003
...
```

The application shall know which migrations have already been applied.

---

# 47. Backup Before Migration

Before a major database schema migration, SDL ACC should automatically create a safety backup.

Workflow:

```text
Detect Update
      ↓
Backup Database
      ↓
Validate Backup
      ↓
Run Migration
      ↓
Verify Database
      ↓
Start Application
```

If migration fails, the previous backup shall remain available.

---

# 48. Portable Mode Safety

Portable mode shall account for removable storage behavior.

The application should:

- Detect storage availability
- Avoid continuous unnecessary writes
- Flush important data
- Handle drive removal gracefully
- Provide safe-eject capability
- Prevent active database operations during eject

---

# 49. USB Performance Considerations

The application should not assume that every USB drive has SSD-like performance.

Recommended:

> USB 3.0+ high-quality flash drive or portable SSD.

Users should avoid very low-quality or failing USB drives for primary accounting data.

---

# 50. Temporary Files

Temporary files shall not unnecessarily remain on the USB drive.

The application may use a local temporary directory for:

- PDF generation
- Report generation
- Export preparation

Temporary files shall be cleaned after successful completion where appropriate.

---

# 51. Offline Report Requirements

Reports shall be generated locally.

No report shall require:

```text
Cloud API
Internet API
Remote database
Online authentication
```

---

# 52. Localization Requirements

V1 shall support:

- English UI
- Indian Rupee (₹)
- Indian-style number formatting where required

Future versions may support:

- Telugu
- Hindi
- Additional currencies
- Additional regional formats

---

# 53. Date and Time Requirements

The application shall use the Windows system date/time by default.

Dates shall be stored in an unambiguous database format.

Recommended internal representation:

```text
YYYY-MM-DD
```

Date-time values should use a consistent representation throughout the application.

---

# 54. Time Zone Requirements

For a single-user local deployment, the system may use the Windows local time zone.

The application should avoid inconsistent timestamps between frontend, Rust, and SQLite.

---

# 55. Logging Requirements

The application should maintain diagnostic logs for:

- Startup
- Database initialization
- Database failures
- Backup
- Restore
- Storage errors
- Migration errors
- Unexpected application failures

Logs should be rotated or limited in size.

---

# 56. Testing Environment

Testing should be performed on:

### Minimum Environment

```text
Windows 10 64-bit
4 GB RAM
Dual-core CPU
```

### Recommended Environment

```text
Windows 11 64-bit
8–16 GB RAM
SSD
```

### Portable Testing

At least:

- USB 2.0 device
- USB 3.0 device
- Local SSD
- Different drive letters
- USB disconnect scenario

---

# 57. Security Testing

Testing should include:

- Invalid database path
- Unauthorized file access
- Corrupt database
- Invalid backup
- Interrupted backup
- Interrupted transaction
- USB removal during operation
- Application crash during posting
- Permission-denied scenarios

---

# 58. Performance Testing

Performance testing shall include:

- Large sales database
- Large purchase database
- Large ledger
- Large inventory
- Large report
- Large export
- Multiple years of transactions
- Large backup

The application should remain responsive during normal operations.

---

# 59. Reliability Testing

The system shall be tested for:

```text
Create → Save → Close → Reopen
```

and:

```text
Create → Crash Simulation → Reopen → Verify
```

and:

```text
Create → Backup → Modify → Restore → Verify
```

---

# 60. Deployment Requirements

## Standard Installation

```text
Windows
   ↓
SDL ACC Installer
   ↓
Install Application
   ↓
Create Data Location
   ↓
Launch SDL ACC
```

## Portable Installation

```text
USB
   ↓
Copy SDL_ACC_Portable
   ↓
Run SDL_ACC.exe
   ↓
Use USB Database
```

---

# 61. Recommended Directory Structure

### Installed Mode

```text
Application/
├── SDL_ACC.exe
└── Runtime Files/

User Data/
└── SDL_ACC/
    ├── Data/
    ├── Documents/
    ├── Backups/
    └── Config/
```

### Portable Mode

```text
SDL_ACC/
├── SDL_ACC.exe
├── Data/
├── Documents/
├── Backups/
└── Config/
```

---

# 62. System Resource Summary

## Minimum End-User System

```text
OS       : Windows 10/11 64-bit
CPU      : Dual-core 64-bit
RAM      : 4 GB
Storage  : 2 GB free
Display  : 1280 × 720
USB      : USB 2.0+
Network  : Not required
GPU      : Integrated
```

## Recommended End-User System

```text
OS       : Windows 11 64-bit
CPU      : Intel Core i3 / Ryzen 3+
RAM      : 8 GB+
Storage  : SSD
Free     : 10 GB+
Display  : 1920 × 1080
USB      : USB 3.0+
Network  : Not required
GPU      : Integrated sufficient
```

## Recommended Development System

```text
OS       : Windows 11 64-bit
CPU      : Intel Core i5 / Ryzen 5+
RAM      : 16 GB
Storage  : 512 GB SSD+
Network  : Recommended
Tools    : Node.js + Rust + Tauri + Git
```

---

# 63. System Constraints

SDL ACC V1 shall operate under the following constraints:

1. The core system must work offline.
2. SQLite is the primary database.
3. The application is Windows-first.
4. The system is primarily designed for single-user operation.
5. USB portability is a major requirement.
6. Financial calculations must be accurate.
7. Accounting transactions must be atomic.
8. The system must not require a cloud backend.
9. The production application should not require development runtimes.
10. User data must survive application updates.

---

# 64. Technical Decision Summary

| Area | Selected Requirement |
|---|---|
| OS | Windows 10/11 64-bit |
| Desktop Framework | Tauri 2 |
| Frontend | React |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Charts | Recharts |
| Native Layer | Rust |
| Database | SQLite |
| Database Access | SQLx or rusqlite |
| Storage | Local Disk / USB |
| PDF | Local PDF generation |
| Export | CSV / XLSX |
| Network | Not required |
| Backend Server | Not required |
| Cloud | Not required |
| GPU | Not required |
| Portable Mode | Required |
| Backup | Required |
| Restore | Required |

---

# 65. System Readiness Criteria

SDL ACC shall be considered system-ready when:

- [ ] Application launches successfully on supported Windows versions.
- [ ] No internet connection is required for core features.
- [ ] SQLite database initializes correctly.
- [ ] Database migrations execute correctly.
- [ ] Local storage works.
- [ ] USB storage works.
- [ ] Portable mode works.
- [ ] Backup works.
- [ ] Restore works.
- [ ] Database integrity checks work.
- [ ] Application survives normal shutdown/restart.
- [ ] Accounting transactions remain atomic.
- [ ] Reports work with realistic data.
- [ ] Application works at 100–200% Windows scaling.
- [ ] No development runtime is required by end users.
- [ ] Installer works.
- [ ] Portable build works.
- [ ] Critical error scenarios have been tested.

---

# 66. Final System Requirement

SDL ACC shall be implemented as a **Windows-first, offline-first, local desktop accounting system** using:

```text
React
   +
TypeScript
   +
Vite
   +
Tauri 2
   +
Rust
   +
SQLite
```

The final system shall be capable of running:

```text
WITHOUT INTERNET
WITHOUT CLOUD
WITHOUT A DATABASE SERVER
WITHOUT NODE.JS ON THE USER MACHINE
WITHOUT PYTHON ON THE USER MACHINE
```

while maintaining:

```text
SALES
PURCHASES
INVENTORY
DEBIT NOTES
CREDIT NOTES
LEDGERS
ACCOUNTING
REPORTS
BACKUPS
USB PORTABILITY
```

with data integrity and reliable local storage as the primary engineering priorities.

---

# 67. Recommended Implementation Principle

The architecture should follow this principle:

> **Keep the application simple at the deployment level, but strict at the data level.**

That means:

```text
Simple Deployment
        ↓
Native Desktop Application
        ↓
Local SQLite
        ↓
Strict Transactions
        ↓
Accurate Accounting
        ↓
Reliable Inventory
        ↓
Recoverable Data
```

SDL ACC should not introduce cloud services, remote servers, or unnecessary infrastructure when the same requirement can be fulfilled reliably through the local desktop architecture.

---

**End of System Requirements Specification**
