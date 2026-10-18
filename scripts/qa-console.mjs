/**
 * Diagnóstico por consola de la Edición de Escritorio.
 *
 * Se conecta al puerto de depuración, activa los dominios Runtime y Log, ejecuta
 * una acción opcional (por ejemplo, navegar) y vuelca todo lo que la aplicación
 * escriba en consola, además de las excepciones no capturadas.
 *
 * Uso:
 *   npx electron . --remote-debugging-port=9222
 *   node scripts/qa-console.mjs [@fichero-accion.js] [esperaMs]
 */

import fs from 'node:fs';
import path from 'node:path';

const [, , actionArg = '', waitMsRaw = '8000'] = process.argv;
const waitMs = Number(waitMsRaw) || 8000;
const DEBUG_PORT = process.env.NAVEGADORX_DEBUG_PORT || '9222';
// Cuando hay una web cargada dentro del navegador, el primer objetivo de la lista
// es esa web y no la aplicación. Con NAVEGADORX_TARGET_MATCH se elige a cuál
// apuntar (por ejemplo, NAVEGADORX_TARGET_MATCH=localhost:3000).
const TARGET_MATCH = process.env.NAVEGADORX_TARGET_MATCH || '';

const action = actionArg.startsWith('@') ? fs.readFileSync(path.resolve(actionArg.slice(1)), 'utf-8') : actionArg;

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
          !String(target.url || '').startsWith('chrome-extension://') &&
          (!TARGET_MATCH || String(target.url || '').includes(TARGET_MATCH)),
      );
      if (page) return page;
    } catch {
      // Puerto aún no disponible.
    }
    await sleep(1000);
  }
  throw new Error(`No hay objetivo de depuración en el puerto ${DEBUG_PORT}`);
}

async function main() {
  const target = await findTarget();
  console.log(`[QA] Objetivo: ${target.title} → ${target.url}`);

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let nextId = 1;

  const ready = new Promise((resolve, reject) => {
    socket.addEventListener('open', () => resolve());
    socket.addEventListener('error', () => reject(new Error('Fallo de WebSocket')));
  });

  socket.addEventListener('message', (event) => {
    const raw = typeof event.data === 'string' ? event.data : event.data.toString();
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
      return;
    }

    if (message.method === 'Runtime.consoleAPICalled') {
      const args = (message.params.args || [])
        .map((arg) => arg.value ?? arg.description ?? arg.type)
        .join(' ');
      console.log(`[consola:${message.params.type}] ${args}`);
    }

    if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params.exceptionDetails;
      console.log(`[excepción] ${details.exception?.description || details.text}`);
    }

    if (message.method === 'Log.entryAdded') {
      const entry = message.params.entry;
      console.log(`[log:${entry.level}] ${entry.text}`);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  await ready;
  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');

  if (action) {
    const result = await send('Runtime.evaluate', { expression: action, awaitPromise: true, returnByValue: true });
    console.log('[QA] Acción:', JSON.stringify(result.result?.value ?? result));
  }

  await sleep(waitMs);

  const state = await send('Runtime.evaluate', {
    expression:
      'JSON.stringify({ bodyLength: document.body.innerHTML.length, texto: document.body.innerText.replace(/\\s+/g," ").slice(0,160) })',
    returnByValue: true,
  });
  console.log('[QA] Estado final:', JSON.stringify(state.result?.value));

  socket.close();
}

main().catch((error) => {
  console.error('[QA] Error:', error.message);
  process.exitCode = 1;
});
