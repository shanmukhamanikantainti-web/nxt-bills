# SDL ACC — Development & Operations Guide

## Requirements
- Node.js 24+ and npm
- Rust toolchain (`stable-x86_64-pc-windows-gnullvm` or MSVC)
- LLVM MinGW / GCC tools for native linking

## Running in Development
```powershell
# In project root
npm run dev
```

To run as full desktop app via Tauri:
```powershell
# From project root with MinGW and Cargo in PATH:
npm run tauri dev
```

## Running Unit and Integration Tests
```powershell
cd src-tauri
cargo test -- --nocapture
```

## Building Production Desktop Bundle
```powershell
npm run build
npm run tauri build
```
The compiled standalone executable and installer will be located in:
`src-tauri/target/release/`
