// Prueba de QA de la Fase 3: comprueba que el proxy afecta de verdad a la red.
(async () => {
  const bridge = window.navegadorX;
  if (!bridge) return 'ERROR: no hay puente nativo';

  const paso = {};

  // 1) Estado inicial: debe ser conexión directa.
  paso.inicial = await bridge.proxy.status();

  // 2) Aplicamos un proxy inexistente: Electron debe aceptarlo y reportarlo.
  paso.aplicado = await bridge.proxy.apply({ scheme: 'socks5', host: '127.0.0.1', port: 59999 });

  // 3) Con ese proxy, una petición real debe fallar.
  paso.pruebaConProxyFalso = await bridge.proxy.test('https://example.com/');

  // 4) Volvemos a conexión directa.
  paso.limpieza = await bridge.proxy.clear();

  // 5) Y ahora la misma petición debe funcionar.
  paso.pruebaDirecta = await bridge.proxy.test('https://example.com/');

  return JSON.stringify(paso, null, 1);
})();
