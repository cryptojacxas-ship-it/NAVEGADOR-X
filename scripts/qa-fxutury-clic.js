// ¿Está viva la interfaz? Hace clic en el icono lateral de VPN.
(() => {
  const antes = document.body.innerText.replace(/\s+/g, ' ').slice(0, 80);

  // Los iconos laterales están en una columna estrecha a la izquierda.
  const punto = { x: 38, y: 264 };
  const el = document.elementFromPoint(punto.x, punto.y);
  if (!el) return JSON.stringify({ ok: false, motivo: 'nada en ese punto', antes });

  const clickable = el.closest('a,button,[role="button"]') || el;
  clickable.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

  return JSON.stringify({
    ok: true,
    etiqueta: clickable.tagName,
    texto: (clickable.textContent || '').trim().slice(0, 40),
    antes,
  });
})();
