/**
 * QA visual de la Edición de Escritorio.
 *
 * Se conecta al protocolo de depuración de Chromium que expone Electron para
 * capturar la pantalla real de la aplicación y, opcionalmente, ejecutar código
 * en el renderer (por ejemplo, para dirigir la navegación antes de capturar).
 *
 * Requisitos:
 *   1. Arrancar la app con el puerto de depuración abierto:
 *        npx electron . --remote-debugging-port=9222
 *   2. Ejecutar:
 *        node scripts/qa-screenshot.mjs <salida.png> [expresiónJS] [esperaMs]
 *
 * Ejemplo (capturar la portada y, después, navegar a un sitio real):
 *        node scripts/qa-screenshot.mjs portada.png
 *        node scripts/qa-screenshot.mjs navegando.png @qa-accion.js 9000
 *
 * El fichero indicado con «@» contiene el código a evaluar antes de capturar.
 */

import fs from 'node:fs';
import path from 'node:path';

const [, , outPath = 'qa-captura.png', expressionArg = '', waitMsRaw = '0'] = process.argv;
const waitMs = Number(waitMsRaw) || 0;
const DEBUG_PORT = process.env.NAVEGADORX_DEBUG_PORT || '9222';

// Si la expresión empieza por «@», se lee de un fichero. Es necesario en Windows,
// donde PowerShell se come las comillas dobles al pasar argumentos a un ejecutable.
const evaluateExpression = expressionArg.startsWith('@')
  ? fs.readFileSync(path.resolve(expressionArg.slice(1)), 'utf-8')
  : expressionArg;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findTarget() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const targets = await response.json();
      // Se descartan DevTools y extensiones: interesa la ventana de la aplicación.
      const page = targets.find(
        (target) =>
          target.type === 'page' &&
          target.webSocketDebuggerUrl &&
          !String(target.url || '').startsWith('devtools://') &&
          !String(target.url || '').startsWith('chrome-extension://'),
      );
      if (page) return page;
    } catch {
      // El puerto todavía no está listo.
    }
    await sleep(1000);
  }
  throw new Error(`No se encontró ningún objetivo de depuración en el puerto ${DEBUG_PORT}`);
}

function createClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  let nextId = 1;

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', () => resolve());
    socket.addEventListener('error', (event) => reject(new Error(`Error de WebSocket: ${event?.message || 'desconocido'}`)));
  });

  socket.addEventListener('message', (event) => {
    let message;
    try {
      message = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
    } catch {
      return;
    }
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`Tiempo de espera agotado en ${method}`));
        }
      }, 30000);
    });

  return { ready, send, close: () => socket.close() };
}

async function main() {
  const target = await findTarget();
  console.log(`[QA] Objetivo: ${target.title} → ${target.url}`);

  const client = createClient(target.webSocketDebuggerUrl);
  await client.ready;
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  if (evaluateExpression) {
    const evaluation = await client.send('Runtime.evaluate', {
      expression: evaluateExpression,
      awaitPromise: true,
      returnByValue: true,
    });
    console.log('[QA] Resultado de la expresión:', JSON.stringify(evaluation));
  }

  if (waitMs > 0) await sleep(waitMs);

  const shot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const absolute = path.resolve(outPath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, Buffer.from(shot.data, 'base64'));
  console.log(`[QA] Captura guardada en ${absolute}`);

  client.close();
}

main().catch((error) => {
  console.error('[QA] Error:', error.message);
  process.exitCode = 1;
});
