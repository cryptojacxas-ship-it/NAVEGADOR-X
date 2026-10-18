// Lista los recursos que fallan, con su URL completa.
(() => {
  const recursos = performance.getEntriesByType('resource');
  const malos = recursos
    .filter((r) => r.responseStatus >= 400 || r.responseStatus === 0)
    .map((r) => ({ url: r.name, estado: r.responseStatus, tipo: r.initiatorType }));

  const scripts = Array.from(document.scripts)
    .filter((s) => s.src)
    .map((s) => s.src);

  return JSON.stringify(
    {
      totalRecursos: recursos.length,
      fallidos: malos.slice(0, 15),
      scriptsConSrc: scripts.slice(0, 12),
      baseDelDocumento: document.baseURI,
    },
    null,
    1,
  );
})();
