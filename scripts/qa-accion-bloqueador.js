// Prueba de QA del bloqueador: crea un webview real y pide un recurso de un dominio
// de la lista. El contador del proceso principal debe subir por la petición cancelada.
(async () => {
  const bridge = window.navegadorX;
  if (!bridge) return 'ERROR: no hay puente nativo';

  const antes = await bridge.blocker.status();

  const wv = document.createElement('webview');
  wv.setAttribute('partition', 'persist:navegadorx');
  wv.setAttribute('src', 'https://example.com');
  wv.style.width = '8px';
  wv.style.height = '8px';
  wv.style.opacity = '0';
  document.body.appendChild(wv);

  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 9000);
    wv.addEventListener('dom-ready', () => {
      clearTimeout(timer);
      resolve();
    });
  });

  const lanzado = await wv.executeJavaScript(
    'new Image().src = "https://www.googletagmanager.com/gtm.js?probe=" + Math.random(); "lanzado"',
  );

  await new Promise((resolve) => setTimeout(resolve, 5000));
  const despues = await bridge.blocker.status();
  wv.remove();

  return JSON.stringify({
    lanzado,
    bloqueadasAntes: antes.totalBlocked,
    bloqueadasDespues: despues.totalBlocked,
    principales: despues.topHosts.slice(0, 3),
  });
})();
