/**
 * Comprueba si el problema de opacidad es solo la ventana en segundo plano.
 *
 * Trae la pestaña al frente (Page.bringToFront), espera a que el navegador
 * reanude las animaciones y vuelve a medir la opacidad de las tarjetas.
 *
 * Uso: node scripts/qa-foco.mjs [puerto]
 */

const DEBUG_PORT = process.argv[2] || process.env.NAVEGADORX_DEBUG_PORT || '9222';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MEDICION = `JSON.stringify({
  opacidadCero: Array.from(document.querySelectorAll('*')).filter((el) => {
    const s = getComputedStyle(el);
    return s.opacity === '0' && el.getBoundingClientRect().height > 40;
  }).length,
  opacidadPrimeraTarjeta: (() => {
    const c = document.querySelector('.glass-card');
    return c ? getComputedStyle(c).opacity : null;
  })(),
  visibilidad: document.visibilityState,
  enfocado: document.hasFocus()
})`;

async function main() {
  const list = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
  const target = list.find(
    (t) => t.type === 'page' && t.webSocketDebuggerUrl && !String(t.url).startsWith('devtools://'),
  );
  if (!target) throw new Error('sin objetivo de página');

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pendientes = new Map();
  let id = 1;

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', () => resolve());
    socket.addEventListener('error', () => reject(new Error('fallo de websocket')));
  });

  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(typeof event.data === 'string' ? event.data : event.data.toString());
    if (msg.id && pendientes.has(msg.id)) {
      pendientes.get(msg.id)(msg.result);
      pendientes.delete(msg.id);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const current = id++;
      pendientes.set(current, resolve);
      socket.send(JSON.stringify({ id: current, method, params }));
    });

  const evaluar = async (expresion) =>
    (await send('Runtime.evaluate', { expression: expresion, returnByValue: true })).result?.value;

  console.log('ANTES  :', await evaluar(MEDICION));

  await send('Page.bringToFront');
  await sleep(3000);

  console.log('DESPUÉS:', await evaluar(MEDICION));

  socket.close();
}

main().catch((error) => {
  console.error('ERROR:', error.message);
  process.exitCode = 1;
});
