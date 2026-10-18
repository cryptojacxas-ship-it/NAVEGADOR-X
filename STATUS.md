# X Browser & X Runtime OS — Status Report

## Release Status
- **Versión:** `v0.3.0-alpha`
- **Tipo de versión:** Pila de red real (proxy) sobre el runtime de escritorio
- **Estado:** Release Candidate (listo para etiquetar)
- **Plataformas objetivo:** Edición de Escritorio (Windows, Electron) + Edición Web (SPA React/TypeScript)
- **Instaladores:** `NavegadorX-Setup-0.3.0-alpha.exe` y `NavegadorX-Portable-0.3.0-alpha.exe`

---

## Estado arquitectónico y contratos

| Módulo / Sistema | Estado | Versión / Contrato | Descripción |
|---|---|---|---|
| **BrowserKernel** | 🟢 Congelado / Estable | `v1.0.0` | Microkernel central: ciclo de vida, eventos y errores |
| **Capability Engine** | 🟢 Congelado / Estable | `v1.0.0` | Registro de capacidades y aplicación de políticas |
| **Provider System** | 🟢 Congelado / Estable | `v1.0.0` | Contratos de proveedor extensibles (Red, IA, Almacenamiento) |
| **Runtime Scheduler** | 🟢 Congelado / Estable | `v1.0.0` | Planificador de tareas no bloqueante por micro-tareas |
| **EventBus System** | 🟢 Congelado / Estable | `v1.0.0` | Bus reactivo con telemetría global |
| **Runtime Inspector** | 🟢 Congelado / Estable | `v1.0.0` | Métricas, inspector de procesos y flujo de eventos |
| **Plugin Host** | 🟢 Congelado / Estable | `v1.0.0` | Cargador de extensiones con manifiestos |
| **Desktop Shell (Electron)** | 🟢 Nuevo en F2 | `v0.2.0` | Contenedor nativo: ventana, menú, protocolo `app://` |
| **Native Download Manager** | 🟢 Nuevo en F2 | `v0.2.0` | Descargas reales a disco con control de pausa y cancelación |
| **Unified AI Client** | 🟢 Nuevo en F2 | `v0.2.0` | Gemini en servidor o proceso principal; motor local sin clave |
| **Proxy Controller** | 🟢 Nuevo en F3 | `v0.3.0` | SOCKS5/SOCKS4/HTTP/HTTPS sobre la sesión, con validación y prueba real |
| **Ad & Tracker Blocker** | 🟢 Nuevo en F3 | `v0.3.0` | Filtrado de red con contadores reales y listas importables |
| **Ownership Panel** | 🟢 Nuevo en F3 | `v0.3.0` | Titularidad, licencia, procedencia y verificación |
| **Per-Tab Routing** | 🟢 Nuevo en F3 | `v0.3.0` | Cada pestaña puede tener partición, cookies y ruta de red propias |
| **Proxy Auth Bridge** | 🟢 Nuevo en F3 | `v0.3.0` | Credenciales vía evento `login`; solo en memoria, nunca en disco |
| **Firestore Security** | 🟢 Configurado | `v1.0.0` | Reglas por rol (`users`, `vpn_nodes`, `logs`) |

---

## Evidencia de validación

| Hipótesis / Objetivo | Estado | Evidencia |
|---|---|---|
| **El Runtime puede desacoplar UI y servicios** | ✅ Validado | `BrowserKernel` + `ProviderSystem` + `EventBus` |
| **El sistema puede extenderse mediante Plugins** | ✅ Validado | `PluginHost` funcional con carga de manifiestos |
| **La UI funciona sobre contratos del Runtime** | ✅ Validado | Cliente SPA interactuando solo vía bus de eventos |
| **El Kernel permanece estable durante la evolución** | ✅ Validado en F1 y F2 | Los contratos `v1.0.0` no se modificaron al añadir el shell nativo |
| **El Runtime corre sobre un contenedor de escritorio** | ✅ Validado en F2 | Shell Electron con la misma interfaz y el mismo kernel |
| **El navegador puede abrir webs reales** | ✅ Validado en F2 | `<webview>` carga sitios reales; se registró una carga de página medida en el propio motor |
| **Las descargas se escriben en disco** | ✅ Validado en F2 | Fichero descargado y verificado en la carpeta del sistema, con progreso real |
| **Arranque sin servicios externos** | ✅ Validado en F2 | La aplicación funciona sin ninguna clave y responde desde el motor local |
| **El tráfico puede enrutarse por un proxy** | ✅ Validado en F3 | Con un proxy inexistente la petición falla con `ERR_PROXY_CONNECTION_FAILED`; en directo responde HTTP 200 en ~270 ms |
| **La interfaz no miente sobre la red** | ✅ Validado en F3 | El panel muestra el valor real de `resolveProxy` (`DIRECT` o `SOCKS5 host:puerto`) |
| **Las credenciales de proxy no persisten** | ✅ Validado en F3 | Viven solo en memoria del proceso principal; no se escriben en disco |
| **Las pestañas pueden salir por rutas distintas** | ✅ Validado en F3 | Con proxy en una pestaña dedicada, su petición falla mientras la sesión compartida sigue respondiendo 200 |
| **El renderer no puede crear sesiones arbitrarias** | ✅ Validado en F3 | Una partición fuera del patrón permitido se rechaza con «Partición no válida» |
| **El bloqueador corta peticiones reales** | ✅ Validado en F3 | Detectados y cancelados `tpc.googlesyndication.com` y `static.doubleclick.net` al cargar un sitio real |
| **La titularidad se puede comprobar en la máquina** | ✅ Validado en F3 | El panel lee autor, licencia, versión, runtime y rutas del propio programa en ejecución |

### Pendiente de validación (fases futuras)

| Capacidad / Componente | Estado | Hito objetivo |
|---|---|---|
| **Pila de red nativa y SOCKS5** | 🟡 Parcial | Fase 3: proxy por sesión listo; falta enrutado por pestaña y reglas |
| **Integración Tor y aislamiento de circuitos** | ⏳ Pendiente | Fase 4 (`v0.4.0-alpha`) |
| **Conectores entre navegadores** | ⏳ Pendiente | Fase 5 (`v0.5.0-beta`) |
| **Navegador de conocimiento autónomo** | ⏳ Pendiente | Fase 6 (`v1.0`) |

---

## Hipótesis objetivo para la Fase 3 (`v0.3.0-alpha`)

> **Hipótesis F4:** *X Runtime OS puede aislar circuitos de red por pestaña, de modo que dos pestañas salgan por rutas distintas sin compartir estado.*

---

## Métricas técnicas del sistema

- **Arquitectura del runtime:** microkernel (X Runtime OS), contratos congelados `v1.0.0`
- **Arquitectura de la interfaz:** SPA React 19 + Vite 6 + Tailwind 4 + Lucide
- **Contenedor de escritorio:** Electron 44 con `contextIsolation` y `sandbox` activos
- **Persistencia:** IndexedDB (sesiones y marcadores) + partición `persist:navegadorx` (cookies) + Firebase Firestore (opcional)
- **Capacidades de red:** conexión directa o proxy SOCKS5/SOCKS4/HTTP/HTTPS aplicado a la sesión (Fase 3, parcial). Tor **no implementado**
- **Estado de compilación:** 0 errores de TypeScript (`tsc --noEmit` limpio) y `vite build` correcto
- **Tamaño del paquete de interfaz:** 1,6 MB repartidos en trozos; el principal son 268 kB (≈68 kB comprimido) + 95 kB de CSS. Firebase (458 kB), gráficos (269 kB), React (194 kB) y el resto van en trozos separados y cacheables

---

## Declaración de honestidad

Los paneles de **minería, la lista de nodos VPN y Privacy Shield** son demostraciones de interfaz. No ejecutan operaciones reales: no minan criptomonedas, no crean túneles fijos ni alteran huellas digitales del navegador. El proyecto no implementará minería real. El **proxy de red**, el **enrutado por pestaña** y el **bloqueador de anuncios**, en cambio, son reales y afectan a tu conexión. El mapa para sustituir cada simulación por datos reales está en `docs/DATOS-REALES.md`.

---

## Resumen de la hoja de ruta

1. **v0.1.0-alpha:** Edición web, kernel, scheduler, inspector, persistencia local. ✅
2. **v0.2.0-alpha:** Edición de escritorio con motor de navegación real, descargas a disco y modo autónomo. ✅
3. **v0.3.0-alpha (actual):** Proxy de red real (SOCKS5/SOCKS4/HTTP/HTTPS) con autenticación y prueba de conexión. 🟡 Fase 3 parcial
4. **v0.4.0-alpha:** Integración de Tor y aislamiento de circuitos por pestaña.
5. **v0.5.0-beta:** Conectores con Chrome, Edge y Firefox.
6. **v1.0:** Navegador de conocimiento autónomo.
