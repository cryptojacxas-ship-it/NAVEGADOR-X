// Marcadores fiables de que React montó y de que Next envió los datos de vuelo.
(() => {
  const clavesReact = (el) => (el ? Object.keys(el).filter((k) => k.startsWith('__react')) : []);
  const cont = document.getElementById('__next') || document.querySelector('main') || document.body.firstElementChild;

  return JSON.stringify(
    {
      contenedor: cont ? `${cont.tagName}#${cont.id}` : null,
      clavesEnContenedor: clavesReact(cont),
      clavesEnBody: clavesReact(document.body),
      hayDatosDeVuelo: document.documentElement.innerHTML.includes('__next_f'),
      tamanoHtml: document.documentElement.innerHTML.length,
      scriptCount: document.scripts.length,
      ultimoScript: document.scripts[document.scripts.length - 1]?.src?.slice(-60) || 'inline',
    },
    null,
    1,
  );
})();
