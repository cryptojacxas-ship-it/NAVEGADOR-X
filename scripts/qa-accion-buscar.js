// Comprueba el buscador: navega a una búsqueda real de Google como la que
// lanza el cuadro de búsqueda de la pantalla de inicio.
(() => {
  const input = document.getElementById('navx-address-input');
  if (!input) return 'ERROR: sin barra de direcciones';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'https://www.google.com/search?q=navegador+de+prueba');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return 'búsqueda lanzada';
})();
