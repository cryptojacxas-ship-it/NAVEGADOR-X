// ¿Está hidratado el panel? ¿Qué pasa con la opacidad ahora?
(() => {
  const cards = Array.from(document.querySelectorAll('.glass-card'));
  const conOpacidadCero = Array.from(document.querySelectorAll('*')).filter((el) => {
    const s = getComputedStyle(el);
    return s.opacity === '0' && el.getBoundingClientRect().height > 40;
  });

  const primera = cards[0];
  const clavesReact = primera ? Object.keys(primera).filter((k) => k.startsWith('__react')) : [];

  return JSON.stringify(
    {
      tarjetasGlass: cards.length,
      conOpacidadCero: conOpacidadCero.length,
      hidratado: clavesReact.length > 0,
      clavesReact,
      estiloEnLinea: primera ? primera.getAttribute('style') : null,
      clasePrimera: primera ? primera.className : null,
      primerHijoHtml: primera ? primera.outerHTML.slice(0, 220) : null,
    },
    null,
    1,
  );
})();
