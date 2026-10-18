# X Browser & X Runtime OS — Official Roadmap

This document outlines the evolutionary milestones for **X Runtime OS** and **X Browser**.

---

## 🟢 Phase 1: Web Runtime Edition & Architecture Consolidation (v0.1.0-alpha) — *COMPLETED*
- [x] Microkernel architecture design (`BrowserKernel`, `EventBus`, `Scheduler`).
- [x] Capability & Provider contracts registration engine.
- [x] X Browser client UI with multi-tab workspace & IndexedDB session storage.
- [x] Real-time Runtime Inspector & System Metrics panel.
- [x] Firestore security hardening with role-based access control.
- [x] Transparent roadmap UI modal replacing legacy installer simulations.

---

## 🟢 Phase 2: Desktop Runtime Migration (v0.2.0-alpha) — *COMPLETED*
- [x] Packaging X Browser & X Runtime OS into an Electron desktop container shell.
- [x] Native OS window control and framing (custom title bar, min/max/close, app menu).
- [x] Real browsing engine: `<webview>` in an isolated process with a persistent session partition.
- [x] Secure `app://bundle` protocol so the UI gets a standard, secure origin.
- [x] Real downloads written to the OS Downloads folder, with pause, resume and cancel.
- [x] IPC bridge for kernel-to-OS calls without modifying any frozen kernel contract.
- [x] Offline-first startup: the app runs with no API keys and no external services.
- [x] Time-of-load telemetry measured by the real engine, not estimated.
- [x] Windows installers (NSIS + portable) built with electron-builder.

### Known limitations of Phase 2/3
- The desktop app is not code-signed, so Windows shows an "unknown publisher" warning.
- Google sign-in opens in a child window now, but Firebase may still reject the `app://`
  origin as an unauthorised domain. The app is fully usable without an account.
- A tab with its own route stops sharing cookies with the rest: that is the point, but it
  means you may have to sign in again in that tab.
- Tor is supported by pointing the proxy at a local instance (ports 9050/9150); no Tor
  daemon is bundled.

---

## 🟡 Phase 3: Native Network Stack (v0.3.0-alpha) — *PARTIALLY COMPLETED*
- [x] Proxy controller bound to the browser session (SOCKS5, SOCKS4, HTTP, HTTPS).
- [x] Strict input validation: scheme whitelist, host and port range checks. No PAC scripts,
      no arbitrary rule strings, no built-in server lists.
- [x] Proxy authentication through Electron's `login` event, credentials held in memory only.
- [x] Real connectivity test that travels through the configured route (`ses.fetch`).
- [x] The resolved route is read back from Electron (`resolveProxy`) and shown to the user,
      so the panel never claims a state it cannot prove.
- [x] Per-tab route selection: a tab can be given its own session partition, with its own
      cookie jar and its own proxy, isolated from the shared session.
- [x] Partition names are validated against a strict pattern, so the renderer cannot create
      arbitrary sessions.
- [ ] Dedicated network health telemetry provider.
- [ ] Rule-based routing (direct for local hosts, proxy for the rest).

---

## ⏳ Phase 4: Tor Network Integration (v0.4.0-alpha)
- [ ] Embedded Tor daemon lifecycle manager.
- [ ] Tor circuit isolation per browser tab.
- [ ] On-demand darknet proxy routing.

---

## ⏳ Phase 5: Multi-Browser Connectors (v0.5.0-beta)
- [ ] Profile & session sync connector for Chrome, Edge, and Firefox.
- [ ] Shared tab state & cross-browser bookmark bridge.

---

## ⏳ Phase 6: Autonomous Knowledge Browser (v1.0)
- [ ] Integrated AI Knowledge engine for automated web research, indexing, and synthesis.

---

## ❌ Explicitly out of scope

- **Cryptocurrency mining.** The project will not implement real mining (hashing, pools, wallets or worker configuration). The mining panel remains a clearly-labelled interface demonstration only.
