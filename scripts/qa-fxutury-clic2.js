// Clic dirigido a un enlace real de la barra lateral y comprobación de si cambia la vista.
(() => {
  const enlaces = Array.from(document.querySelectorAll('a[href]'));
  const lista = enlaces.map((a) => ({ href: a.getAttribute('href'), texto: (a.textContent || '').trim().slice(0, 30) }));
  const objetivo = enlaces.find((a) => /vpn|shield/i.test(a.getAttribute('href') || '')) || enlaces[2];

  const antes = document.body.innerText.replace(/\s+/g, ' ').slice(0, 90);
  if (objetivo) {
    objetivo.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  }

  return JSON.stringify(
    {
      enlacesEncontrados: lista.slice(0, 10),
      clicado: objetivo ? objetivo.getAttribute('href') : null,
      antes,
    },
    null,
    1,
  );
})();
