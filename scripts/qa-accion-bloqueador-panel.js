// Acción de QA: abre el panel del bloqueador.
(() => {
  const input = document.getElementById('navx-address-input');
  if (!input) return 'ERROR: sin barra de direcciones';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'navegador://bloqueador');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return 'abriendo el bloqueador';
})();
