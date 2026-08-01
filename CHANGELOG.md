# Changelog — X Browser & X Runtime OS

All notable changes to this project are documented in this file.

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
