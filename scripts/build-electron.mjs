/**
 * Compila el shell de escritorio (electron/*.ts) a CommonJS dentro de electron-dist/.
 *
 * Se usa esbuild porque ya es una dependencia del proyecto (lo trae Vite) y produce
 * un arranque más rápido que mantener una segunda configuración de TypeScript.
 *
 * Uso:
 *   node scripts/build-electron.mjs           → build de producción (minificado)
 *   node scripts/build-electron.mjs --dev     → build de desarrollo (sourcemaps)
 *   node scripts/build-electron.mjs --watch   → reconstrucción continua
 */

import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dev = process.argv.includes('--dev');
const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const shared = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  // `electron` lo inyecta el propio runtime; nunca debe empaquetarse.
  external: ['electron'],
  sourcemap: dev ? 'inline' : false,
  minify: !dev,
  logLevel: 'info',
  define: {
    'process.env.NODE_ENV': JSON.stringify(dev ? 'development' : 'production'),
  },
};

const targets = [
  {
    ...shared,
    entryPoints: [path.join(rootDir, 'electron', 'main.ts')],
    outfile: path.join(rootDir, 'electron-dist', 'main.cjs'),
  },
  {
    ...shared,
    entryPoints: [path.join(rootDir, 'electron', 'preload.ts')],
    outfile: path.join(rootDir, 'electron-dist', 'preload.cjs'),
  },
];

if (watch) {
  const contexts = await Promise.all(targets.map((options) => esbuild.context(options)));
  await Promise.all(contexts.map((context) => context.watch()));
  console.log('[build-electron] Observando cambios en electron/…');
} else {
  await Promise.all(targets.map((options) => esbuild.build(options)));
  console.log('[build-electron] Shell de escritorio compilado en electron-dist/');
}
