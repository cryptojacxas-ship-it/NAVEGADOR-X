// Fuerza la visibilidad de los elementos que quedaron en opacidad 0.
// Sirve para confirmar que el contenido está bien y solo falla la animación.
(() => {
  const els = Array.from(document.querySelectorAll('*')).filter((el) => {
    const s = getComputedStyle(el);
    return s.opacity === '0' && el.getBoundingClientRect().height > 40;
  });
  els.forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  return JSON.stringify({ ajustados: els.length, etiquetas: els.slice(0, 8).map((e) => e.className.slice(0, 60)) });
})();
