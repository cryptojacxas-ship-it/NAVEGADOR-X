// Prueba de QA: enrutado de red por pestaña, aislado de la sesión compartida.
(async () => {
  const bridge = window.navegadorX;
  if (!bridge) return 'ERROR: no hay puente nativo';

  const tabPartition = 'persist:navegadorx-tab-tab-qa';
  const paso = {};

  // 1) Situación de partida: todo directo.
  paso.compartidaAntes = await bridge.proxy.status();
  paso.pestanaAntes = await bridge.proxy.status(tabPartition);

  // 2) Damos ruta propia a una pestaña y le ponemos un proxy inexistente.
  paso.preparada = await bridge.proxy.ensure(tabPartition);
  paso.aplicadoEnPestana = await bridge.proxy.apply({
    partition: tabPartition,
    scheme: 'socks5',
    host: '127.0.0.1',
    port: 59998,
    remember: false,
  });

  // 3) La sesión compartida NO debe haberse visto afectada.
  paso.compartidaDespues = await bridge.proxy.status();
  paso.pestanaDespues = await bridge.proxy.status(tabPartition);

  // 4) La ruta de la pestaña debe fallar, y la compartida seguir funcionando.
  paso.pruebaPestana = await bridge.proxy.test(tabPartition, 'https://example.com/');
  paso.pruebaCompartida = await bridge.proxy.test(undefined, 'https://example.com/');

  // 5) Una partición no permitida debe ser rechazada.
  paso.particionInvalida = await bridge.proxy.apply({
    partition: 'persist:ajena',
    scheme: 'socks5',
    host: '127.0.0.1',
    port: 1080,
  });

  // 6) Limpieza.
  paso.limpieza = await bridge.proxy.clear(tabPartition);

  return JSON.stringify(paso, null, 1);
})();
