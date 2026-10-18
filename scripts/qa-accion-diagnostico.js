// Diagnóstico de QA: informa del estado real del viewport y de la barra del navegador.
(() => {
  const webview = document.querySelector('webview');
  return JSON.stringify({
    url: location.href,
    titulo: document.title,
    hayWebview: Boolean(webview),
    srcWebview: webview ? webview.getAttribute('src') : null,
    urlWebview: webview && typeof webview.getURL === 'function' ? webview.getURL() : null,
    cargando: webview && typeof webview.isLoading === 'function' ? webview.isLoading() : null,
    barraDireccion: Boolean(document.getElementById('navx-address-input')),
    textoVisible: document.body.innerText.replace(/\s+/g, ' ').slice(0, 220),
  });
})();
