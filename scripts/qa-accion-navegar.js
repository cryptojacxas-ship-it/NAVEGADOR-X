// Acción de QA: escribe una URL en la barra de direcciones y envía el formulario,
// igual que haría una persona. Se ejecuta dentro del renderer vía CDP.
(() => {
  const input = document.getElementById('navx-address-input');
  if (!input) return 'ERROR: no se encontró la barra de direcciones';

  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'https://example.com');
  input.dispatchEvent(new Event('input', { bubbles: true }));

  const form = input.closest('form');
  if (!form) return 'ERROR: la barra de direcciones no está dentro de un formulario';

  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return 'navegación enviada a https://example.com';
})();
