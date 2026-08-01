# ADR 0001: Baseline Architecture & Governance (v1.0)

## Context
When **X Browser** development began, the application combined UI components, mock services, and experimental runtime logic into a single web application. As requirements grew to support custom networking, plugin sandboxing, AI integration, and desktop runtime targets, maintaining coupled components became a source of technical debt and architectural degradation.

## Decision
We established **X Runtime OS** as an independent microkernel platform (`BrowserKernel`, `CapabilityContract`, `ProviderContract`, `RuntimeScheduler`, `EventBus`, `PluginHost`) with **X Browser** operating purely as a reference client consuming the runtime.

Furthermore, we instituted the following architectural decisions:
1. **ADR-0001 — Runtime First:** X Runtime OS is the primary platform; client applications consume public contracts.
2. **ADR-0002 — Contract Stability:** Public contracts (`v1.0.0`) are frozen. Core modifications require an approved Architecture Change Request (ACR).
3. **ADR-0003 — Provider Independence:** Subsystems (AI, Network, Storage, Mining) interact via abstract provider interfaces rather than locked implementations.
4. **ADR-0004 — Architecture Freeze:** Phase 1 core logic is frozen to validate stability before introducing Phase 2 desktop runtimes.
5. **ADR-0005 — Browser as Reference Client:** The web UI is one client among multiple potential runtime consumers.
6. **ADR-0006 — Evidence Before Architecture:** Permanent decisions require reproducible experimental evidence rather than speculative feature additions.

## Status
**Accepted & Enforced** as of `v0.1.0-alpha`.

## Consequences
- Core contracts cannot be changed arbitrarily without an ACR.
- New functionality must be added via Capabilities, Providers, Plugins, or Services.
- The platform remains portable across Web SPA, Desktop Shells (Electron/Tauri), and native IPC bridges.
