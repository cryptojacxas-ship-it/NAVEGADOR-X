import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEEDS_DIR = path.join(__dirname, 'seeds');

function readJson(filename: string) {
  const filePath = path.join(SEEDS_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filename: string, data: any) {
  const filePath = path.join(SEEDS_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export const db = {
  vPNServer: {
    findMany: async () => {
      return readJson('vpnServers.json');
    }
  },
  browsingSession: {
    create: async ({ data }: { data: any }) => {
      const sessions = readJson('browsingSessions.json');
      const newSession = { ...data, id: Math.random().toString(36).substr(2, 9), createdAt: new Date() };
      sessions.push(newSession);
      writeJson('browsingSessions.json', sessions);
      return newSession;
    },
    update: async ({ where, data }: { where: { id: string }, data: any }) => {
      const sessions = readJson('browsingSessions.json');
      const index = sessions.findIndex((s: any) => s.id === where.id);
      if (index === -1) throw new Error('Session not found');
      sessions[index] = { ...sessions[index], ...data };
      writeJson('browsingSessions.json', sessions);
      return sessions[index];
    }
  },
  aIPreference: {
    findFirst: async ({ where }: { where: { userId: string } }) => {
      const prefs = readJson('aiPreferences.json');
      return prefs.find((p: any) => p.userId === where.userId) || null;
    },
    upsert: async ({ where, update, create }: { where: { userId: string }, update: any, create: any }) => {
      const prefs = readJson('aiPreferences.json');
      const index = prefs.findIndex((p: any) => p.userId === where.userId);
      if (index !== -1) {
        prefs[index] = { ...prefs[index], ...update };
      } else {
        prefs.push(create);
      }
      writeJson('aiPreferences.json', prefs);
      return index !== -1 ? prefs[index] : create;
    }
  }
};
