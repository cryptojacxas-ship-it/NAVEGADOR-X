// ¿Cargaron los recursos JavaScript de Next?
(() => {
  const recursos = performance.getEntriesByType('resource');
  const js = recursos
    .filter((r) => r.name.includes('.js') || r.initiatorType === 'script')
    .map((r) => ({
      fichero: r.name.split('/').pop().slice(0, 46),
      estado: r.responseStatus,
      kb: Math.round(r.transferSize / 1024),
      ms: Math.round(r.duration),
    }));

  const fallidos = js.filter((r) => r.estado >= 400);
  const sinCargar = recursos.length === 0;

  return JSON.stringify(
    {
      readyState: document.readyState,
      totalRecursos: recursos.length,
      scriptsEnDom: Array.from(document.scripts).map((s) => (s.src ? s.src.split('/').pop() : 'inline')).slice(0, 8),
      js: js.slice(0, 14),
      fallidos,
      sinCargar,
      nextPresente: typeof window.next !== 'undefined',
    },
    null,
    1,
  );
})();
