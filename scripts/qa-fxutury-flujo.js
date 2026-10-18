// Diagnóstico de hidratación: ¿llegó completo el flujo de datos de Next?
(() => {
  const pruebas = {};

  pruebas.visibilidad = document.visibilityState;
  pruebas.enfocado = document.hasFocus();

  // Longitud del flujo de datos de React (__next_f)
  pruebas.nextF = typeof window.__next_f !== 'undefined' ? window.__next_f.length : 'no existe';

  // ¿El HTML termina bien?
  const html = document.documentElement.outerHTML;
  pruebas.htmlTerminaBien = html.trim().endsWith('</html>');
  pruebas.ultimos80 = html.trim().slice(-80).replace(/\s+/g, ' ');

  // ¿localStorage funciona?
  try {
    window.localStorage.setItem('__prueba', '1');
    window.localStorage.removeItem('__prueba');
    pruebas.localStorage = 'ok';
  } catch (e) {
    pruebas.localStorage = 'ERROR: ' + e.message;
  }

  // ¿Hay algún error guardado en la ventana?
  pruebas.hayOnError = typeof window.onerror;

  // Contadores de scripts inline con datos de vuelo
  const inlineConDatos = Array.from(document.scripts).filter((s) =>
    (s.textContent || '').includes('__next_f'),
  ).length;
  pruebas.scriptsConDatosDeVuelo = inlineConDatos;

  return JSON.stringify(pruebas, null, 1);
})();
