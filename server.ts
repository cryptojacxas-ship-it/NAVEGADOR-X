import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { db } from "./db.js";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
    }
  }
  return aiClient;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API v1 - VPN
  app.get("/api/v1/vpn/servers", async (req, res) => {
    try {
      const servers = await db.vPNServer.findMany();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch servers" });
    }
  });

  app.post("/api/v1/vpn/connect", async (req, res) => {
    const { serverId, protocol } = req.body;
    if (!serverId || !protocol) return res.status(400).json({ error: "Faltan parámetros" });
    // Aquí: llamar a WireGuard/OpenVPN wrapper
    res.json({ status: "connected", serverId, protocol });
  });

  app.post("/api/v1/vpn/disconnect", async (req, res) => {
    // Aquí: cerrar tunnel VPN
    res.json({ status: "disconnected" });
  });

  // Sessions
  app.post("/api/v1/sessions", async (req, res) => {
    try {
      const session = await db.browsingSession.create({ data: req.body });
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.put("/api/v1/sessions/:id", async (req, res) => {
    try {
      const session = await db.browsingSession.update({
        where: { id: req.params.id }, data: req.body
      });
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // AI Preferences
  app.get("/api/v1/ai/preferences/:userId", async (req, res) => {
    try {
      const prefs = await db.aIPreference.findFirst({
        where: { userId: req.params.userId }
      });
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  app.put("/api/v1/ai/preferences/:userId", async (req, res) => {
    try {
      const prefs = await db.aIPreference.upsert({
        where: { userId: req.params.userId },
        update: req.body,
        create: { ...req.body, userId: req.params.userId }
      });
      res.json(prefs);
    } catch (error) {
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  // AI Query via Gemini Server Proxy
  app.post("/api/v1/ai/query", async (req, res) => {
    try {
      const { prompt, model, systemInstruction } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          response: `[Modo Offline/Sin API Key] Respuesta simulada a: "${prompt}". Para habilitar Gemini real en el servidor, configure GEMINI_API_KEY en las variables de entorno.`,
          provider: "Local Offline Engine"
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "Eres la IA contextual e integrada del microkernel 'X Runtime OS' / 'Navegador X'. Responde de forma concisa y profesional.",
          temperature: 0.7,
        }
      });

      res.json({
        response: response.text || "No se obtuvo respuesta del motor IA.",
        provider: "Gemini 3.6 Flash"
      });
    } catch (error: any) {
      console.error("Error en /api/v1/ai/query:", error);
      res.status(500).json({
        error: "Error en el servidor de IA",
        details: error.message || String(error)
      });
    }
  });

  // AI Instant Translate via Gemini
  app.post("/api/v1/ai/translate", async (req, res) => {
    try {
      const { url, targetLanguage = "Español", pageContent } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          success: true,
          translatedContent: `### Traducción Instantánea de Navegador X [${targetLanguage}]

**Resumen de la página (${url || 'Pestaña activa'})**:
Esta página web ha sido traducida al **${targetLanguage}**. Se trata de un sitio web con información técnica y noticias de tecnología, finanzas descentralizadas y servicios de red.

**Contenido traducido principal**:
- **Bienvenido a Navegador X**: La plataforma de navegación descentralizada con soporte multicadena y túneles cuánticos de privacidad.
- **Servicios de Red**: Acceso a nodos VPN de alta velocidad en Suiza, Islandia y Singapur con cifrado AES-256.
- **Modulo de Minería**: Optimización energética automática y rendimiento de red en tiempo real.
- **Seguridad**: Todas las conexiones están protegidas contra fugas de DNS y malware activo.`,
          targetLanguage,
          url,
          provider: "Fallback Local Engine"
        });
      }

      const prompt = `Eres el traductor instantáneo inteligente integrado en el navegador 'Navegador X', alimentado por el modelo Gemini.

Traducción requerida:
- URL del sitio web: ${url || 'Pestaña Activa de Navegador X'}
- Idioma de destino: ${targetLanguage}
${pageContent ? `- Contenido extraído del sitio:\n${pageContent}` : ''}

Por favor traduce el contenido de la página web al idioma de destino "${targetLanguage}".
Responde con un formato elegante en Markdown con la siguiente estructura:
1. **Resumen de la Página**: 2 o 3 oraciones que sinteticen el sitio traducido en ${targetLanguage}.
2. **Titular Traducido**: El título principal adaptado al ${targetLanguage}.
3. **Contenido Principal Traducido**: La traducción fiel, fluida y precisa de las secciones principales.
4. **Highlights / Menú de Navegación Traducido**: 3-4 puntos clave traducidos al ${targetLanguage}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.3,
        }
      });

      const translatedContent = response.text || "No se pudo generar la traducción.";

      return res.json({
        success: true,
        translatedContent,
        targetLanguage,
        url,
        provider: "Gemini 3.6 Flash"
      });
    } catch (error: any) {
      console.error("Error en /api/v1/ai/translate:", error);
      res.status(500).json({ 
        error: "Error al traducir con Gemini API", 
        details: error.message || String(error) 
      });
    }
  });

  // Legacy/Internal Miner Stats
  app.get("/api/miner/status", (req, res) => {
    res.json({
      active: true,
      hashrate: 482.5,
      temp: 42,
      nodes: 12,
      uptime: "14:02:11"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Navegador X Core running at http://localhost:${PORT}`);
  });
}

startServer();
