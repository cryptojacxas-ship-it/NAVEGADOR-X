// Prueba de QA: lanza una descarga nativa real a través del puente y devuelve
// el estado de la lista de descargas un instante después.
(async () => {
  const bridge = window.navegadorX;
  if (!bridge) return 'ERROR: no hay puente nativo (¿se está ejecutando en el navegador?)';

  bridge.downloads.start('https://raw.githubusercontent.com/cryptojacxas-ship-it/NAVEGADOR-X/main/package.json');
  await new Promise((resolve) => setTimeout(resolve, 6000));

  const items = await bridge.downloads.list();
  return JSON.stringify(
    items.map((item) => ({
      archivo: item.filename,
      estado: item.state,
      recibidos: item.receivedBytes,
      ruta: item.savePath,
    })),
  );
})();
