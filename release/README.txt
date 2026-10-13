========================================================================
SDL ACC — Offline Desktop Accounting & Inventory System
Version 1.0.0 (Production Release)
========================================================================

SYSTEM REQUIREMENTS:
- Windows 10 (64-bit) / Windows 11 (64-bit)
- Microsoft Edge WebView2 Runtime (Pre-installed on Windows 10/11)
- ZERO external dependencies (No Node.js, Rust, Cargo, Python, or Git needed)

------------------------------------------------------------------------
DEPLOYMENT MODES & INSTALLATION GUIDE
------------------------------------------------------------------------

MODE 1: INSTALLED MODE (Recommended for standard office PCs)
1. Run "SDL_ACC_Setup.exe" directly from your USB drive or desktop.
2. Follow the setup wizard to install SDL ACC for the current user.
3. Launch SDL ACC from the Start Menu or desktop shortcut.
4. Your accounting data is safely isolated in `%LOCALAPPDATA%\SDL_ACC`
   so software updates will NEVER overwrite your accounting books.

MODE 2: PORTABLE USB MODE (Run entirely from flash drive across PCs)
1. Extract or copy the entire "SDL_ACC_Portable" folder to your USB drive
   or any local directory (e.g. E:\SDL_ACC_Portable, D:\Accounting).
2. The presence of "portable.flag" beside SDL_ACC.exe signals portable mode.
3. Launch "SDL_ACC.exe".
4. All company databases, documents, backups, and logs remain strictly inside
   this folder. No files are written to the host computer's operating system.
5. You can plug this USB drive into any compatible Windows PC and launch it
   immediately regardless of the drive letter assigned (E:, F:, G:, etc.).

------------------------------------------------------------------------
FOLDER STRUCTURE (PORTABLE PACKAGE):
------------------------------------------------------------------------
SDL_ACC_Portable/
│
├── SDL_ACC.exe        (Standalone application binary)
├── portable.flag      (Activates portable root relative resolution)
│
├── Data/              (SQLite database: company.sqlite)
├── Documents/         (Logical relative storage: Sales, Purchases, Notes)
│   ├── Sales/
│   ├── Purchases/
│   ├── DebitNotes/
│   └── CreditNotes/
├── Backups/           (Verified SQLite backups)
├── Config/            (Application configurations)
└── Logs/              (Operational logs)

------------------------------------------------------------------------
USB CRASH SAFETY & EJECT:
------------------------------------------------------------------------
Before removing your USB drive, navigate to "Storage & Backup" in SDL ACC
and click "Safely Flush & Checkpoint WAL" or exit the application cleanly.
This ensures all database transactions are committed and handles released.
