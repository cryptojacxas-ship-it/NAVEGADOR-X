# Navegador X — Browser Runtime OS (v0.1.0-alpha)

[![Runtime OS](https://img.shields.io/badge/Runtime%20OS-v1.0-00d2ff?style=flat-square)](https://github.com/cryptojacxas-ship-it/NAVEGADOR-X)
[![Browser Kernel](https://img.shields.io/badge/Kernel-Operational-27c93f?style=flat-square)](https://github.com/cryptojacxas-ship-it/NAVEGADOR-X)
[![Version](https://img.shields.io/badge/Release-v0.1.0--alpha%20(Web%20Edition)-ff3cac?style=flat-square)](https://github.com/cryptojacxas-ship-it/NAVEGADOR-X)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

Navegador X es un prototipo de navegador web de nueva generación construido como una aplicación SPA (React + TypeScript) para validar la arquitectura de su **Runtime OS v1.0** y **Browser Kernel** totalmente modular.

> ℹ️ **Nota Importante de Estado (v0.1.0-alpha)**:
> Esta versión es una **demostración web / validación de arquitectura** (SPA sobre React + Vite + TypeScript) que se ejecuta dentro del navegador. No es aún un ejecutable nativo ni instala un navegador a nivel de sistema operativo. Las capacidades de red profunda (VPN, Tor, descargas por chunks a disco) y la versión de escritorio ejecutable (`.exe` basada en Electron / Tauri) se encuentran en desarrollo activo.

---

## 📊 Estado Actual de Implementación (Current Implementation Status)

| Componente / Módulo | Estado de Desarrollo | Descripción |
| :--- | :--- | :--- |
| **Web Runtime Client (SPA)** | ✅ Implementado | Cliente de referencia React + Vite + TypeScript. |
| **BrowserKernel & EventBus** | ✅ Implementado | Núcleo de orquestación, eventos y desacoplamiento. |
| **Capability Engine & Contracts** | ✅ Implementado | Sistema de permisos, capacidades y políticas congeladas. |
| **Plugin Host & Worker Queue** | ✅ Implementado | Planificador no bloqueante cooperativo. |
| **Runtime Inspector OS** | ✅ Implementado | Telemetría, métricas y monitoreo de procesos. |
| **Cortex AI Layer** | ✅ Implementado | Integración server-side con Gemini API. |
| **Turbo Download Manager** | 🧪 Prototipo / Mock UI | Interfaz y simulación de tasa de transferencia. |
| **Privacy Shield & Anti-Fingerprinting** | 🧪 Prototipo / Mock UI | Simulación de intercepción de Canvas, WebGL y WebRTC. |
| **Desktop Edition (Electron / Tauri)** | 🚧 Planeado (Fase 2) | Contenedor nativo para verificación de portabilidad. |
| **Native SOCKS5 & Tor Tunneling** | 🚧 Planeado (Fase 3/4) | Pila de red nativa a nivel de sistema operativo. |
| **Cross-Browser Connectors** | 🚧 Planeado (Fase 5) | Extensión/Conector para navegadores existentes. |

---

## ⚡ Novedades en la versión v0.1.0-alpha (Web Edition)

- **Navegación Fluida e Historial Real**: Control total de pila de navegación (Atrás, Adelante, Recargar), barra de direcciones unificada para URLs web (`https://...`) y esquemas internos (`navegador://...`, `runtime://...`), y medidor de latencia de carga en milisegundos.
- **Dashboard Operativo & Hoja de Ruta**: Panel de mando interactivo con resumen de estado, exportador de manifiesto de versión e información sobre la futura versión nativa de escritorio.
- **Gestor de Descargas (Simulación de UI / Mock Turbo)**: Interfaz de gestión de descargas con cálculo dinámico de tasa de transferencia, pausa, reanudación y modo Turbo simulado.
- **Runtime Inspector OS**: Visualizador de rendimiento del Scheduler, aislamiento de tareas, monitoreo de memoria IDB y registro de eventos del sistema.
- **Anti-Fingerprinting Privacy Shield (Módulo interactivo)**: Intercepción y simulación de mitigación de fingerprinting en Canvas, WebGL, AudioContext y WebRTC.
- **X-Ray DOM Inspector**: Herramienta de radiografía estructural para inspeccionar y depurar el árbol DOM de las páginas.
- **Cortex AI Layer & Traducción Instantánea**: Integración con Gemini AI para asistencia contextual y traducción instantánea multilingüe de páginas web.
- **Servicios de Red & Minería (Simulados)**: Paneles de configuración de VPN, Tor y Rig de minería en modo simulación para validación de interfaz y arquitectura.

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
