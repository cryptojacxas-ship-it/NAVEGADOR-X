// Abre la web de fxutury dentro del webview de Navegador X (control independiente).
(() => {
  const input = document.getElementById('navx-address-input');
  if (!input) return 'ERROR: sin barra de direcciones';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'http://localhost:3000/');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return 'abriendo localhost:3000';
})();
