// Prueba del buscador: escribe una frase sin ser una dirección y envía.
(() => {
  const input = document.getElementById('navx-address-input');
  if (!input) return 'ERROR: sin barra de direcciones';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'mejores restaurantes cerca de mi');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

  return JSON.stringify({ enviado: 'mejores restaurantes cerca de mi' });
})();
