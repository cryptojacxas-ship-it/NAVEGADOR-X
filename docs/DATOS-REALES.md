# Dónde cambiar las simulaciones por datos reales

Guía práctica del proyecto **Navegador X (v0.3.0-alpha)**.

Cada apartado indica el fichero exacto, el nombre de la constante o función que hay que
tocar, qué es lo que hoy está inventado y qué forma tiene el dato real que debería ocupar
su lugar. Los que ya son reales se listan al final, para que no los busques.

---

## Índice rápido

| Módulo | Fichero | Qué es simulado | Sustituto real |
|---|---|---|---|
| Minería | `src/components/MinerDashboard.tsx` | hashrate, CPU, nodos, X-Token | borrar, o métricas reales del sistema |
| Motor de la minería | `src/hooks/useMiner.ts` | worker con `Math.random` | — (no aplica) |
| Endpoint de minería | `server.ts` → `/api/miner/status` | cifras fijas | — |
| Nodos VPN (fallback) | `src/components/VPNDashboard.tsx` | 4 nodos escritos a mano | tu API de nodos |
| Nodos VPN (semilla) | `seeds/vpnServers.json` + `db.ts` | 7 nodos en un JSON | base de datos o API |
| Privacy Shield | `src/components/PrivacyShield.tsx` | contadores y reglas | datos reales del bloqueador |
| Mercado | `src/components/MarketplaceView.tsx` | catálogo `ITEMS` | manifiestos de plugins o API |
| Panel de administración | `src/components/AdminPanel.tsx` | `chartData` y `stats` | consultas agregadas reales |
| Descargas (solo web) | `src/components/DownloadManager.tsx` | `DEMO_DOWNLOADS` | ya es real en escritorio |
| Base de datos de ejemplo | `db.ts` + `seeds/*.json` | "base de datos" de ficheros JSON | tu base de datos real |

---

## 1. Minería (lo más importante: decide si lo quieres)

**Está en:** `src/components/MinerDashboard.tsx`, `src/hooks/useMiner.ts` y el endpoint
`/api/miner/status` de `server.ts`.

**Qué es simulado**
- `useMiner.ts` crea un *Web Worker* cuyo código es literalmente
  `hashRate: (Math.random() * 50 + 400) * (cpuCap / 30)`. No calcula nada.
- `MinerDashboard.tsx` genera las "ganancias" con `prev + (0.0000001 * (cpuCap / 30))` y las
  guarda en Firestore (`users.earnings`).
- Los nodos vienen de `/api/miner/status`, que devuelve números fijos (`hashrate: 482.5`,
  `nodes: 12`).

**Opciones, de más honesta a menos**

1. **Quitarlo** — recomendado si el navegador no va a minar:
   ```bash
   rm src/components/MinerDashboard.tsx src/components/MinerConsentModal.tsx src/hooks/useMiner.ts
   ```
   Después: quita el import y la línea `{activeTab === 'miner' && <MinerDashboard />}` de
   `src/App.tsx`, el elemento `{ id: 'miner', ... }` del array `tabs` y el endpoint de
   `server.ts`. El proyecto ya declara en `ROADMAP.md` que no implementará minería real.

2. **Convertirlo en un panel de hardware real** — reaprovecha lo que ya existe: el proceso
   principal expone `system:metrics` (memoria, CPU y procesos reales). En
   `MinerDashboard.tsx` sustituye `useMiner()` por:
   ```ts
   const metrics = await window.navegadorX?.system.metrics();
   // metrics.totalCpuPercent, metrics.totalMemoryMb, metrics.processes
   ```
   y renombra el panel a "Rendimiento del equipo". Los contadores dejarán de ser ficticios
   porque pasarás a mostrar medidas del sistema.

3. **Hacerla funcional de verdad** — fuera del alcance de este proyecto y, por decisión
   explícita, no se va a implementar. Si algún día lo abordas, todo el trabajo vive en
   `useMiner.ts` (el worker) y en cómo repartes las ganancias en Firestore.

---

## 2. Lista de nodos VPN

Hay **dos** sitios con nodos, y los dos son de mentira.

### 2.1 El respaldo escrito a mano

**Fichero:** `src/components/VPNDashboard.tsx`
**Constante:** el bloque `setNodes([...])` dentro del `.catch(...)` del `useEffect`
(alrededor de la línea 46).

```ts
setNodes([
  { id: 'zh-01', name: 'Zurich Secure 01', country: 'Suiza', latency: 12, ... },
  ...
]);
```

Sustituye ese array por los nodos que devuelva tu API. Si tu API falla, muestra un estado
vacío real en lugar de un respaldo inventado:
```ts
.catch(() => { setNodes([]); setErrorApi(true); });
```

### 2.2 La semilla del servidor

**Ficheros:** `seeds/vpnServers.json` (7 nodos), `db.ts` (los lee y los escribe) y
`server.ts` → `app.get('/api/v1/vpn/servers')`.

`db.ts` no es una base de datos: son ficheros JSON en la carpeta `seeds/`. Para datos reales
tienes dos caminos:

- **Rápido:** edita `seeds/vpnServers.json` con tus nodos reales (id, nombre, país, latencia,
  carga, protocolos, tipo). La interfaz los pintará tal cual.
- **Correcto:** en `VPNDashboard.tsx` cambia la URL del `fetch('/api/v1/vpn/servers')` por la
  de tu API, y borra el endpoint de `server.ts`. El tipo de dato que espera la interfaz es la
  interfaz `Node` que está al principio del propio fichero.

### 2.3 Ojo con la latencia y la carga

Los campos `latency` y `load` solo tienen sentido si los mide alguien. Si tu API no los
calcula, es mejor **quitar esas dos columnas de la interfaz** que rellenarlas con números
inventados: enseña el país y el protocolo, que sí son ciertos.

### 2.4 Y recuerda qué es lo que enruta de verdad

El panel que **sí** cambia tu conexión es `src/components/NetworkPanel.tsx` (proxy real
SOCKS5/HTTP/HTTPS, por sesión o por pestaña). Conectar un nodo de esta lista no hace nada
hoy: si quieres que un nodo de la lista se pueda usar, el camino es pasar sus datos
(esquema, host, puerto) a `NetworkPanel` y aplicar el proxy ahí.

---

## 3. Privacy Shield

**Fichero:** `src/components/PrivacyShield.tsx`

**Qué es simulado**
- Los contadores de las reglas (`adBlocker`, `fingerprintCloaking`, `webrtcLeak`, …) y el
  `blockedCount` por sitio.
- El `setInterval(..., 2500)` que incrementa contadores y publica `privacy.threat_blocked` en
  el EventBus (`globalEventBus.publish('privacy.threat_blocked', ...)`).
- Los interruptores no modifican ningún comportamiento del navegador.

**Cómo convertirlo en algo real**

El bloqueo de red real ya existe: está en `electron/adblock.ts` y su contador sale de
`blocker:status`. Para que este panel deje de ser decorativo tienes dos opciones:

1. **Mostrar los datos del bloqueador** (lo honesto y rápido): suscríbete a `blocker:status`
   desde `window.navegadorX.blocker.status()` y pinta `totalBlocked` y `topHosts`. Elimina el
   `setInterval` que inventa incrementos.
2. **Implementar protección de huella digital de verdad**: eso exige inyectar código en cada
   página antes de que se ejecute, es decir un `preload` en el `<webview>` (hoy se elimina a
   propósito en `will-attach-webview`, en `electron/main.ts`) o `webContents.executeJavaScript`
   en el proceso principal. Es un trabajo considerable y conviene hacerlo con cuidado: romper
   el `preload` es exactamente lo que permitiría a una web escapar del aislamiento.

---

## 4. Mercado

**Fichero:** `src/components/MarketplaceView.tsx`
**Constante:** `const ITEMS = [...]` (línea 5).

Es un catálogo escrito a mano. Sustituto real: los manifiestos que ya existen en
`src/plugins/manifests/` (`downloadService.manifest.json`, `privacyService.manifest.json`) o
una API propia que devuelva la misma forma de objeto. La ventaja de los manifiestos es que el
kernel ya sabe leerlos: `kernel.registerPluginFromManifest(...)` en `BrowserKernel.ts`.

---

## 5. Panel de administración

**Fichero:** `src/components/AdminPanel.tsx`

Aquí hay de todo, y conviene distinguirlo:

| Parte | Estado |
|---|---|
| Usuarios (`collection(db, 'users')`) | ✅ Real: lee Firestore |
| Nodos (`collection(db, 'vpn_nodes')`) | ✅ Real: lee Firestore |
| Registros (`collection(db, 'logs')`) | ✅ Real: lee Firestore |
| `const chartData = [...]` (línea ~70) | ❌ Inventado |
| `const [stats, setStats] = useState({...})` | ❌ Valores iniciales a mano |

Para los dos últimos: sustitúyelos por consultas agregadas (`getCountFromServer`,
`getAggregateFromServer` de Firestore) o por métricas del propio equipo
(`window.navegadorX.system.metrics()`), y **quita las gráficas** si no tienes de dónde
sacarlas. Una gráfica sin datos reales es peor que no tener gráfica.

> Si no has configurado Firebase, todo lo que dependa de Firestore aparecerá vacío. Eso es
> correcto: significa que no hay datos, no que sean cero.

---

## 6. Descargas (solo en la edición web)

**Fichero:** `src/components/DownloadManager.tsx`
**Constante:** `DEMO_DOWNLOADS`.

En la **Edición de Escritorio** este componente ya usa descargas reales
(`useNativeDownloads()` → `will-download` en `electron/main.ts`). El modo demostración solo se
activa cuando la aplicación corre dentro de un navegador, porque ahí no puede escribir en tu
disco. Está etiquetado con la insignia `SIMULACIÓN`. No hay nada que cambiar salvo que quieras
quitar la demo.

---

## 7. La "base de datos" de ejemplo

**Ficheros:** `db.ts` y `seeds/*.json`.

`db.ts` implementa `findMany`, `create`, `update`… leyendo y escribiendo ficheros JSON con
`fs`. Es un andamio, no una base de datos. Sustituto real: tu base de datos (Postgres, SQLite,
Firestore, lo que uses) implementando los mismos tres métodos:
`vPNServer.findMany`, `browsingSession.create/update` y `aIPreference.findFirst/upsert`.
Como la interfaz solo habla con `server.ts`, puedes cambiar `db.ts` entero sin tocar la UI.

---

## 8. Lo que ya es real (no lo busques)

Para que no pierdas el tiempo intentando "des-simular" cosas que ya se miden:

| Módulo | De dónde salen los datos |
|---|---|
| Navegación | `<webview>` de Electron, eventos reales del motor |
| Tiempo de carga | `viewport.loadend`, medido por el proceso de render |
| Descargas (escritorio) | Evento `will-download` y ficheros escritos en disco |
| Proxy y rutas por pestaña | `session.setProxy` + `resolveProxy` |
| Bloqueador de anuncios | `electron/adblock.ts`, contadores reales |
| Consumo del runtime (`QuickStats`) | `system:metrics` (memoria/CPU/procesos) |
| Actividad del Runtime | EventBus del microkernel (`getHistory()`) |
| Conexión de red | Estado real: directa o proxy, sin adornos |
| Protecciones | Lista de lo que de verdad está activo |
| Marcadores y sesiones | IndexedDB |
| Traducción e IA | Gemini si hay clave; motor local si no (`aiClient.ts`) |

---

## 9. Cómo comprobar que no queda nada inventado

Busca los patrones típicos de datos falsos:

```bash
# Números aleatorios presentados como métricas
rg "Math.random\(\)" src/

# Arrays de datos escritos a mano en componentes
rg "^\s*const \w+ = \[\s*$" src/components/

# Temporizadores que "mueven" cifras sin que pase nada real
rg "setInterval" src/components/
```

Regla práctica que sigue este proyecto: **si un número no se puede medir, se dice que no se
puede medir; no se rellena.** Si añades un panel nuevo, o mide algo de verdad o lleva el aviso
de `SimulationNotice`.
