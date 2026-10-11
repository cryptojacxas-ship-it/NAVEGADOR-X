/**
 * API Fallbacks for GitHub Pages (no backend server)
 * All API calls fall back to mock data when server is unavailable
 */

export async function fetchVPNServers() {
  try {
    const response = await fetch('/api/v1/vpn/servers');
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.log('[API Fallback] VPN servers unavailable, using mock data');
  }

  // Mock VPN servers for offline mode
  return [
    {
      id: 'zh-01',
      name: 'Zurich Secure 01',
      country: 'Suiza',
      latency: 12,
      status: 'online',
      load: 34,
      protocols: ['WireGuard', 'OpenVPN'],
      type: 'premium'
    },
    {
      id: 'is-01',
      name: 'Reykjavik Vault',
      country: 'Islandia',
      latency: 45,
      status: 'online',
      load: 18,
      protocols: ['WireGuard'],
      type: 'premium'
    },
    {
      id: 'sg-01',
      name: 'Singapore Cyber',
      country: 'Singapur',
      latency: 120,
      status: 'online',
      load: 62,
      protocols: ['WireGuard', 'Tor'],
      type: 'free'
    },
    {
      id: 'nl-01',
      name: 'Amsterdam Freedom',
      country: 'Países Bajos',
      latency: 28,
      status: 'online',
      load: 45,
      protocols: ['WireGuard'],
      type: 'free'
    }
  ];
}

export async function fetchAIQuery(prompt: string, model?: string, systemInstruction?: string) {
  try {
    const response = await fetch('/api/v1/ai/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model, systemInstruction })
    });

    if (response.ok) {
      const data = await response.json();
      return data.response;
    }
  } catch (err) {
    console.log('[API Fallback] AI query unavailable, using mock response');
  }

  // Mock AI response for offline mode
  const mockResponses: Record<string, string> = {
    'resume': 'Resumen de contenido: Esta es una página web con información técnica y contenido multimedia. La estructura principal incluye navegación, contenido central y pie de página con enlaces útiles.',
    'analyze': 'Análisis completado. Se detectaron componentes interactivos, recursos multimedia y scripts de terceros. Todo ha sido catalogado en la inspección X-Ray.',
    'default': `[Modo Navegador X - Sin Conexión a Servidor]

Respuesta simulada para tu consulta: "${prompt}"

Navegador X está operando en modo offline con todas las características de frontend disponibles:
- ✓ Traducción instantánea simulada
- ✓ Análisis DOM con X-Ray
- ✓ Configuración de privacidad
- ✓ Dashboards de VPN y minería
- ✓ Interfaz completa del navegador

Para habilitar las funciones de IA en servidor (Gemini API), deberás desplegar un backend Node.js con las variables de entorno correspondientes.`
  };

  const key = prompt.toLowerCase();
  if (key.includes('resum')) return mockResponses.resume;
  if (key.includes('analiz')) return mockResponses.analyze;
  return mockResponses.default;
}

export async function fetchAITranslate(url: string, targetLanguage: string = 'Español', pageContent?: string) {
  try {
    const response = await fetch('/api/v1/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, targetLanguage, pageContent })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data;
      }
    }
  } catch (err) {
    console.log('[API Fallback] AI translate unavailable, using mock response');
  }

  // Mock translation for offline mode
  return {
    success: true,
    translatedContent: `### Traducción Instantánea [${targetLanguage}]

**Página Web**: ${url || 'Pestaña activa'}

**Resumen de la página traducida**:
Esta página web ha sido analizada y adaptada al idioma **${targetLanguage}**. Se trata de un sitio web con información técnica, contenido multimedia y servicios de red.

**Contenido Principal Traducido**:
- **Bienvenido a Navegador X**: La plataforma de navegación descentralizada con soporte multicadena y túneles cuánticos de privacidad.
- **Servicios de Red**: Acceso a nodos VPN de alta velocidad en Suiza, Islandia y Singapur con cifrado AES-256.
- **Módulo de Minería**: Optimización energética automática y rendimiento de red en tiempo real.
- **Seguridad**: Todas las conexiones están protegidas contra fugas de DNS y malware activo.

**Highlights / Menú Traducido**:
1. Panel de Control Privado y Seguro
2. Herramientas de Traducción en Tiempo Real
3. Análisis de Privacidad Web (X-Ray DOM)
4. Configuración Avanzada de Privacidad`,
    targetLanguage,
    url,
    provider: 'Navegador X [Modo Offline]'
  };
}
