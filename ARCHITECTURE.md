# X Runtime OS — Software Architecture Guide

## System Overview

**X Runtime OS** is a modular microkernel-based software platform designed to power web and desktop applications with strict process scheduling, capability management, event-driven reactive messaging, and plugin execution sandboxing. **X Browser** operates as the primary user-facing web/desktop client consuming this runtime.

```
┌─────────────────────────────────────────────────────────┐
│                    X Browser Client                     │
│  (React 19 + Tailwind CSS + Tab / Workspace Manager)    │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                    X Runtime OS                         │
├─────────────────────────────────────────────────────────┤
│  • BrowserKernel (Lifecycle, Boot, Error Delegation)    │
│  • Capability Engine (Security & Access Rules)          │
│  • Provider Engine (Network, Storage, AI)               │
│  • Runtime Scheduler (Priority Task Execution)          │
│  • EventBus (Pub/Sub & Global Telemetry)                │
│  • Plugin Host (Sandboxed Extension Runner)             │
│  • Runtime Inspector (Process & Log Metrics)            │
└───────────────────────────┬─────────────────────────────┘
                            │  (mismo kernel, sin cambios)
┌───────────────────────────▼─────────────────────────────┐
│         Contenedores de ejecución (Fase 2)              │
├─────────────────────────────────────────────────────────┤
│  • Web Runtime  → navegador anfitrión, viewport iframe  │
│  • Desktop Shell → Electron: ventana, protocolo app://, │
│    webview aislado, descargas a disco, puente IPC       │
└─────────────────────────────────────────────────────────┘
```

---

## Core Architectural Guiding Principles

### 1. Principle of Runtime Stability
The **BrowserKernel** and its core interfaces are **FROZEN**. The core OS code evolves strictly through **Capabilities**, **Providers**, **Plugins**, and **Services**. Any modification to `BrowserKernel.ts`, `CapabilityContract.ts`, or `RuntimeScheduler.ts` requires a formal **Architecture Change Request (ACR)** justifying why existing abstraction layers are insufficient.

### 2. Provider & Capability Decoupling
- **Capabilities** define abstract features (`network.proxy`, `ai.generation`, `storage.vault`).
- **Providers** supply concrete implementations for capabilities. Providers register with the kernel without mutating kernel code.

### 3. Shell Adds, Kernel Does Not Change
The desktop container (Electron) contributes native capabilities — real viewport, disk downloads,
windows, IPC — through the `preload` bridge and the `EventBus`. It must never edit kernel files or
public contracts: adding an execution environment is a container concern, not a kernel concern.

### 4. No Invented Data
Every metric shown to the user must be measured or explicitly labelled as an interface demonstration.
Panels that only render an idea (VPN node list, Privacy Shield, mining) must carry a visible simulation notice.

### 5. Real Capabilities Behind Every Control
When a control can genuinely affect the machine or the network, it must do so through the runtime and
report back what the operating system actually did — never what the interface assumes. The proxy panel,
for instance, displays the route Electron resolves, not the value the user typed.

### 3. Server-Side Security & Firestore Governance
- All sensitive API operations and secrets are maintained on server-side proxies or handled via authenticated Firebase rules.
- Role-based security guarantees that client read operations follow exact security privileges.

---

## Platform Identity

- **Platform:** `X Runtime OS` — Microkernel execution engine for browser capabilities.
- **Reference Client:** `X Browser` — Web SPA & workspace client validating the runtime.
- **Target Shells (Roadmap):** Electron, Tauri, WebView2, Multi-Browser Connectors.

---

## Mission Statement

> *X Runtime OS is an evidence-driven execution platform designed to provide a stable, provider-independent runtime for browser capabilities. Every architectural evolution must preserve public contracts, maintain backward compatibility, and be supported by reproducible experimental evidence before becoming part of the Baseline.*

---

## Baseline Scope (v1.0)

### Included in Baseline
- ✅ `BrowserKernel` lifecycle & event delegation
- ✅ `Capability Engine` & access control contracts
- ✅ `Provider Engine` (Network, AI, Storage interfaces)
- ✅ `RuntimeScheduler` non-blocking worker queue
- ✅ `EventBus` reactive pub/sub bus
- ✅ `PluginHost` sandbox extension runner
- ✅ `RuntimeInspector` metrics & process monitor
- ✅ `X Browser` Web SPA reference client
- ✅ `Desktop Shell` (Electron container) — added in `v0.2.0-alpha` as an execution environment, not a kernel change
- ✅ `Proxy Controller` (session-scoped SOCKS5/SOCKS4/HTTP/HTTPS) — added in `v0.3.0-alpha`

### Non-Goals (Explicitly Excluded from Baseline)
- ❌ Per-tab network isolation (Planned F4)
- ❌ Embedded Tor daemon & circuit isolation (Planned F4)
- ❌ Chrome / Firefox cross-browser connectors (Planned F5)
- ❌ Autonomous AI Knowledge research engine (Planned F6)
- ❌ Cryptocurrency mining, in any form: no hashing, pools, wallets or worker configuration.
  The mining panel stays a labelled interface demonstration.

---

## Architectural Invariants (Baseline v1.0)

- **I-001 — Runtime First:** X Runtime OS is the primary platform. X Browser is the reference client.
- **I-002 — Contract Stability:** Public contracts define the Runtime API and remain backward compatible unless superseded through an approved Architecture Change Request (ACR).
- **I-003 — Capability-Based Evolution:** New functionality must be introduced through Capabilities, Providers, Plugins, or Services before modifying the Kernel.
- **I-004 — Provider Independence:** The Runtime remains independent from any specific AI provider, rendering engine, storage backend, or network implementation.
- **I-005 — Runtime Observability:** Every subsystem must expose metrics, events, or introspection endpoints through the Runtime.
- **I-006 — Evidence Before Architecture:** Permanent architectural decisions require reproducible experimental evidence.

---

## Definition of Success

The architecture is considered validated when:
1. The Runtime executes across multiple execution environments (Web SPA, Desktop Shell, Native IPC).
2. Public contracts remain backward compatible across major release targets.
3. Providers can be swapped or replaced at runtime without modifying `BrowserKernel`.
4. X Browser remains only one possible client among multiple potential Runtime consumers.
5. Every major architectural decision is supported by documented, reproducible evidence.

---

## Directory & Module Layout

```
/electron
  ├── main.ts                 # Main process: window, app:// protocol, downloads, AI, menu
  └── preload.ts              # Single typed bridge exposed to the renderer

/src
  /kernel
    ├── BrowserKernel.ts       # Core lifecycle & global listener delegate
    ├── CapabilityContract.ts  # Contract definitions & capability manager
    ├── ProviderContract.ts    # Abstract provider registry & interfaces
    ├── RuntimeScheduler.ts    # Task queue & non-blocking execution worker
    ├── EventBus.ts            # Typed reactive event publisher/subscriber
    ├── PluginHost.ts          # Plugin loader & lifecycle sandbox
    └── RuntimeInspector.ts     # Health diagnostics, logs & metrics monitor
  /components                  # X Browser UI views & components
    ├── BrowserViewport.tsx     # Browsing engine: webview (desktop) or iframe (web)
    ├── DesktopTitleBar.tsx     # Native window chrome
    ├── ErrorBoundary.tsx       # UI fault isolation
    └── SimulationNotice.tsx    # Shared disclosure for demo-only panels
  /lib
    ├── desktop.ts              # Native bridge detection & access
    └── aiClient.ts             # Unified AI client (web proxy / main process / local)
  /services                    # Application domain services & state engines
```
