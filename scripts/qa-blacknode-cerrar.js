// Prueba el botón «×» de la pestaña de la web: debe devolver el panel.
(() => {
  const boton = document.querySelector('button[title="Cerrar la web y volver al panel"]');
  if (!boton) {
    return JSON.stringify({ ok: false, motivo: 'no se encontró el botón de cerrar la web' });
  }
  boton.click();
  return JSON.stringify({ ok: true, accion: 'pulsado el botón de cerrar la web' });
})();
