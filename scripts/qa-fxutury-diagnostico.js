// Diagnóstico para fxutury: por qué las tarjetas del Control Center no se ven.
(() => {
  const buscar = (texto) => {
    const todos = Array.from(document.querySelectorAll('div,section,article,li'));
    return todos.find((el) => (el.textContent || '').includes(texto) && el.children.length <= 3);
  };

  const describir = (el) => {
    if (!el) return 'no encontrado';
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return {
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      opacity: s.opacity,
      display: s.display,
      visibility: s.visibility,
      overflow: s.overflow,
      transform: s.transform,
    };
  };

  const mineria = buscar('No active mining');
  const vpn = buscar('1 servers available');

  // ¿Cuántos elementos hay con opacidad 0?
  const invisibles = Array.from(document.querySelectorAll('*')).filter((el) => {
    const s = getComputedStyle(el);
    return s.opacity === '0' && el.getBoundingClientRect().height > 40;
  }).length;

  return JSON.stringify(
    {
      ventana: { w: window.innerWidth, h: window.innerHeight },
      scrollHeight: document.body.scrollHeight,
      contenedorMineria: describir(mineria),
      contenedorVpn: describir(vpn),
      padreMineria: mineria ? describir(mineria.parentElement) : 'n/a',
      elementosConOpacidadCero: invisibles,
      textoVisible: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 300),
    },
    null,
    1,
  );
})();
