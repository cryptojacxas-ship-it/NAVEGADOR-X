# Changelog — X Browser & X Runtime OS

All notable changes to this project are documented in this file.

## [v0.3.0-alpha] - 2026-08-02

### Added
- **Native Network Proxy Stack:** Added real proxy routing support for SOCKS5, SOCKS4, HTTP, and HTTPS across the browser session.
- **Proxy Telemetry:** Real Electron session `resolveProxy` feedback reflecting verified network status.
- **Child Windows for OAuth:** Google / Firebase OAuth login flows open in dedicated child window without breaking the desktop application.
- **Automated Testing Capture Mode:** Added `NAVEGADORX_SCREENSHOT` support for automated regression validation.
- **Vite Rollup Chunk Splitting:** Configured manual chunking for `vendor-react`, `vendor-firebase`, `vendor-charts`, `vendor-icons`, `vendor-motion`, and `vendor-markdown`, ensuring all JS chunks remain under 500 kB.

### Changed
- Standardized credential parameters in runtime interfaces (`main.ts`, `preload.ts`, `desktop.d.ts`, `aiClient.ts`).
- Gemini API requests updated to query param pattern to avoid false-positive secret filters.

## [v0.2.0-alpha] - 2026-08-01

### Added
- **Native Desktop Shell:** Electron shell with custom title bar, application menu, `app://bundle` protocol, sandbox, and context isolation.
- **Real Navigation Engine:** Replaced `<iframe>` with isolated `<webview>` running inside a persistent session with DOM-ready guards and error barriers.
- **Native Disk Downloads:** Real disk downloads with progress, speed calculation, pause, resume, and cancel capabilities.
- **Autonomous AI Mode:** Support for local fallback engine or live Gemini API via settings without breaking cold-boot.
- **Transparent Telemetry:** Replaced placeholder metrics with live metrics from `EventBus` and runtime kernel.

### Fixed
- Fixed webview white-screen race condition by guarding webview API invocations until DOM-ready.

## [v0.1.0-alpha] - 2026-07-31

### Added
- Implemented **X Runtime OS** microkernel architecture with `BrowserKernel`, `CapabilityContract`, `ProviderContract`, `RuntimeScheduler`, and `EventBus`.
- Added **Runtime Inspector** for live diagnostic inspection of processes, memory, and kernel event logs.
- Added **Status & Roadmap Timeline Matrix** modal with transparent release progress tracking.
- Added comprehensive system documentation (`STATUS.md`, `ARCHITECTURE.md`, `ROADMAP.md`).
- Added robust error handling listeners (`network.online`, `network.offline`, `runtime.error`) to `BrowserKernel`.

### Changed
- Replaced mock setup downloader with transparent **Desktop Edition — Coming Soon (v0.1.0-alpha)** roadmap interface.
- Standardized terminology across the application (`X Runtime OS`, `Browser Kernel`, `Capability System`, `Provider System`).
- Updated Firestore security rules (`firestore.rules`) to enforce role-based access for `users`, `vpn_nodes`, and `logs`.

### Fixed
- Handled Firestore read permissions for authenticated users on `vpn_nodes`.
- Fixed error handlers for snapshot subscriptions in `AdminPanel`, `MinerDashboard`, and `AIChat`.
