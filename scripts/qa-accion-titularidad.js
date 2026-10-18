// Acción de QA: abre el panel del propietario y su pestaña de titularidad.
(() => {
  const input = document.getElementById('navx-address-input');
  if (!input) return 'ERROR: sin barra de direcciones';
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'navegador://admin');
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.closest('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

  setTimeout(() => {
    const botones = Array.from(document.querySelectorAll('nav button'));
    const objetivo = botones.find((b) => /titularidad/i.test(b.textContent || ''));
    if (objetivo) objetivo.click();
  }, 2500);

  return 'abriendo titularidad';
})();
