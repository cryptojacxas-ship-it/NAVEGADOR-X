// Acción de QA: vuelve al panel principal para revisar las métricas reales.
(() => {
  const input = document.getElementById('navx-address-input');
  if (!input) return 'ERROR: sin barra de direcciones';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'navegador://dashboard');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return 'navegando al panel';
})();
