# Navegador X — Browser Runtime OS (v0.1.0-alpha)

[![Runtime OS](https://img.shields.io/badge/Runtime%20OS-v1.0-00d2ff?style=flat-square)](https://github.com/navegadorx)
[![Browser Kernel](https://img.shields.io/badge/Kernel-Operational-27c93f?style=flat-square)](https://github.com/navegadorx)
[![Version](https://img.shields.io/badge/Release-v0.1.0--alpha%20(Web%20Edition)-ff3cac?style=flat-square)](https://github.com/navegadorx)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

Navegador X es un navegador web de nueva generación construido sobre un **Runtime OS v1.0** y un **Browser Kernel** totalmente modular en TypeScript. Combina navegación fluida, aceleración de descargas, protección anti-fingerprinting activa y capacidades de Inteligencia Artificial nativas.

> ℹ️ **Nota de Edición**: La versión **v0.1.0-alpha** es la **Web Runtime Edition** (React + TypeScript). La versión de escritorio nativa (`.exe` ejecutable para Windows basada en Electron / Tauri) se encuentra actualmente en desarrollo activo para las siguientes entregas.

---

## ⚡ Novedades en la versión v0.1.0-alpha (Web Edition)

- **Navegación Fluida e Historial Real**: Control total de pila de navegación (Atrás, Adelante, Recargar), barra de direcciones unificada para URLs web (`https://...`) y esquemas internos (`navegador://...`, `runtime://...`), y medidor de latencia de carga en milisegundos.
- **Dashboard Operativo & Hoja de Ruta**: Panel de mando interactivo con resumen de estado, exportador de manifiesto de versión e información sobre la futura versión nativa de escritorio.
- **Gestor de Descargas Acelerado (Turbo Mode)**: Descarga paralela de archivos por micro-chunks, soporte para pausar, reanudar y cancelar tareas, y cálculo dinámico de tasa de transferencia.
- **Runtime Inspector OS**: Visualizador de rendimiento del Scheduler, aislamiento de tareas, monitoreo de memoria IDB y registro de eventos del sistema.
- **Anti-Fingerprinting Privacy Shield**: Intercepción y neutralización de fingerprinting en Canvas, WebGL, AudioContext y mitigación de fugas IP en WebRTC.
- **X-Ray DOM Inspector**: Herramienta de radiografía estructural para inspeccionar y depurar el árbol DOM.
- **Cortex AI Layer & Traducción Instantánea**: Integración con Gemini AI para asistencia contextual y traducción instantánea multilingüe de páginas web.

---

## 🗺️ Hoja de Ruta — Próxima Edición de Escritorio (Electron / Tauri)

- [ ] Binario ejecutable e instalador Windows (`NavegadorX-Setup.exe`).
- [ ] Acceso a socket de red nativo para túneles Tor y SOCKS5 a nivel de sistema operativo.
- [ ] Persistencia de descargas aceleradas en sistema de archivos local.
- [ ] Aislamiento de procesos por pestaña en hilos independientes nativos.

---

## 🏗️ Arquitectura del Proyecto

```
src/
├── kernel/                   # Núcleo del Sistema (Browser Kernel Engine)
│   ├── BrowserKernel.ts      # Manejador del Kernel & EventBus
│   ├── RuntimeScheduler.ts   # Planificador de tareas cooperativas por micro-chunks
│   └── types.ts              # Interfaces y contratos del Kernel
├── plugins/                  # Módulos de Extensión del Kernel
│   ├── DownloadServicePlugin.ts # Servicio acelerador de descargas
│   └── PrivacyServicePlugin.ts  # Servicio de escudero de privacidad
├── components/               # Interfaz de Usuario & Vistas Principales
│   ├── DashboardView.tsx     # Centro de control principal & descarga de instalador
│   ├── HomeView.tsx          # Pantalla de inicio con motor de búsqueda y accesos directos
│   ├── DownloadManager.tsx   # Gestor lateral de descargas aceleradas
│   ├── RuntimeInspector.tsx  # Inspección de kernel, scheduler y eventos
│   ├── PrivacyShield.tsx     # Panel de protección anti-fingerprinting
│   ├── XRayDOMInspector.tsx  # Inspector estructural de DOM
│   ├── AIChat.tsx            # Asistente Cortex AI
│   └── ...
├── lib/                      # Servicios auxiliares (Firebase, IndexedDB)
└── App.tsx                   # Punto de entrada de UI y orquestador de navegación
```

---

## 🚀 Instalación y Ejecución

### Prerrequisitos
- Node.js >= 18.0.0
- npm / pnpm / yarn

### Comandos de Desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo en puerto 3000
npm run dev

# 3. Comprobar sintaxis y tipos
npm run lint

# 4. Compilar para producción
npm run build
```

---

## 🛠️ Esquemas de URL Internos Soporte

- `navegador://dashboard` — Centro de mando principal y métricas.
- `navegador://inicio` — Pantalla de bienvenida y motor de búsqueda.
- `runtime://kernel` — Inspector de Runtime OS, tareas e hilos del Kernel.
- `navegador://vpn` — Configuración de nodos de red y túneles VPN cifrados.
- `navegador://mineria` — Panel de rendimiento del Rig.
- `navegador://ia` — Capa de inteligencia Cortex AI.
- `navegador://mercado` — Tienda de complementos y extensiones del Kernel.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más detalles.
