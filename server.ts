import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { db } from "./db.js";

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

  // AI Query
  app.post("/api/v1/ai/query", async (req, res) => {
    const { prompt, contextTabs, options } = req.body;
    // Stub → reemplazar con llamada a OpenAI/local LLM
    res.json({ response: `Resumen de "${prompt}" con ${contextTabs?.length ?? 0} pestañas.` });
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
