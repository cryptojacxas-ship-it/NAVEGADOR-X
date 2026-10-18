// Comprueba el estado del motor: si la web está puesta o retirada, el historial
// real y el texto de la pestaña.
(async () => {
  const bridge = window.blacknode;
  const estado = bridge ? await bridge.getBrowserState() : null;
  const botonCerrar = document.querySelector('button[title="Cerrar la web y volver al panel"]');
  const chip = document.querySelector('header .truncate')?.textContent ?? null;
  const barra = document.querySelector('input[type="text"]');
  return JSON.stringify({
    dentroDeElectron: Boolean(bridge),
    viewportPuesto: estado?.visible ?? null,
    url: estado?.url ?? null,
    titulo: estado?.title ?? null,
    puedeAtras: estado?.canGoBack ?? null,
    puedeAdelante: estado?.canGoForward ?? null,
    cargando: estado?.isLoading ?? null,
    hayBotonDeCerrarLaWeb: Boolean(botonCerrar),
    textoPestana: chip,
    barraDeDirecciones: barra ? barra.value : null,
  });
})();
