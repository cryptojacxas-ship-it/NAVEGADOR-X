// Prueba del motor de blacknode: escribe una dirección en su barra y envía.
(() => {
  const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
  const input = inputs.find((i) => (i.getAttribute('placeholder') || '').toLowerCase().includes('search'))
    || inputs[0];

  if (!input) return JSON.stringify({ ok: false, motivo: 'sin campo de dirección', campos: inputs.length });

  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, 'https://example.com');
  input.dispatchEvent(new Event('input', { bubbles: true }));

  const form = input.closest('form');
  if (!form) return JSON.stringify({ ok: false, motivo: 'la barra no está en un formulario' });
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

  return JSON.stringify({ ok: true, enviado: 'https://example.com', tieneBlacknode: Boolean(window.blacknode) });
})();
