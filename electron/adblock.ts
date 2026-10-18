/**
 * Bloqueador de anuncios y rastreadores — motor de filtrado.
 *
 * Funciona a nivel de red, dentro del proceso principal: intercepta las peticiones
 * de la sesión del navegador (`webRequest.onBeforeRequest`) y cancela las que
 * coinciden con la lista. Es el mismo mecanismo que usan los bloqueadores de
 * escritorio, y por eso los contadores que muestra la interfaz son reales.
 *
 * Alcance y límites, dichos con claridad:
 *   - Bloquea peticiones a dominios de anuncios y rastreadores (terceros).
 *   - NO bloquea anuncios servidos desde el propio dominio del sitio (primera parte):
 *     para eso hacen falta reglas cosméticas, que no están implementadas.
 *   - NO modifica huellas digitales ni intercepta Canvas/WebGL: eso es otra cosa.
 *
 * La lista incluida es propia y corta (dominios de anuncios y analítica conocidos).
 * El usuario puede importar la suya (formato hosts o EasyList básico) desde el panel.
 */

export interface BlockDecision {
  block: boolean;
  host: string;
}

/** Peticiones que nunca se bloquean, pase lo que pase. */
const NEVER_BLOCK = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0']);

/**
 * Lista incluida de dominios de publicidad, analítica y rastreo.
 * Se aplica por sufijo: `doubleclick.net` cubre `ad.doubleclick.net`.
 * Está escrita a mano y es deliberadamente corta y conservadora: no incluye
 * dominios de sitios legítimos que solo alojan algún píxel de seguimiento.
 */
const DEFAULT_BLOCKLIST = `
# --- Redes publicitarias grandes ---
doubleclick.net
googlesyndication.com
googleadservices.com
googletagservices.com
googletagmanager.com
adservice.google.com
pagead2.googlesyndication.com
partner.googleadservices.com
adnxs.com
adsrvr.org
rubiconproject.com
pubmatic.com
openx.net
casalemedia.com
criteo.com
criteo.net
smartadserver.com
adform.net
teads.tv
spotxchange.com
springserve.com
tremorhub.com
districtm.io
sharethrough.com
sovrn.com
indexexchange.com
yieldmo.com
gumgum.com
lijit.com
sonobi.com
33across.com
triplelift.com
bidswitch.net
mopub.com
inmobi.com
applovin.com
unityads.unity3d.com
vungle.com
chartboost.com
ironsrc.com
supersonicads.com
adcolony.com

# --- Intercambios y mercados de datos ---
bluekai.com
demdex.net
everesttech.net
krxd.net
mathtag.com
rlcdn.com
tapad.com
tribalfusion.com
turn.com
moatads.com
quantserve.com
scorecardresearch.com
adobedtm.com
2o7.net
omtrdc.net
sharethis.com
addthis.com
exelator.com
agkn.com
bidr.io
crazyegg.com
hotjar.com
mouseflow.com
luckyorange.com
fullstory.com
inspectlet.com
smartlook.com
clarity.ms
sessioncam.com
quantummetric.com
newrelic.com/browser
optimizely.com
vwo.com
monetate.net
dynamicyield.com
abtasty.com
kameleoon.com
convert.com
crazyegg.com
walkme.com
pendo.io
heap.io
amplitude.com
mixpanel.com
segment.io
segment.com
analytics.google.com
google-analytics.com
ssl.google-analytics.com
statcounter.com
matomo.cloud
piwik.pro
plausible.io/js
umami.is
chartbeat.com
parsely.com
cxense.com
comscore.com
imrworldwide.com
nielsen.com
nielsenccaud1.com
mediametrie-estat.com
atinternet.com
eulerian.net
weborama.fr
xiti.com

# --- Publicidad contextual y nativa ---
taboola.com
outbrain.com
revcontent.com
mgid.com
adcash.com
propellerads.com
popads.net
popcash.net
exoclick.com
juicyads.com
trafficjunky.com
adsterra.com
clickadu.com
hilltopads.net
zeropark.com
admaven.com
bidvertiser.com
infolinks.com
vidoomy.com
adblade.com
nativeads.com
plista.com
ligatus.com
zemanta.com
adyoulike.com
seedtag.com
twiago.com
stroeer.com
teads.com

# --- Móvil y atribución ---
appsflyer.com
adjust.com
branch.io
kochava.com
singular.net
tenjin.io
attribution.report
appmetrica.yandex.net
umeng.com
talkingdata.com
bugly.qq.com
matomo.org/matomo.js

# --- Vídeo y CTV ---
innovid.com
extreme-reach.com
flashtalking.com
sizmek.com
doubleverify.com
iasds01.com
integralads.com
adcolony.com/video
freewheel.tv
conviva.com
mux.com/video-analytics
youbora.com
npa-ads.com

# --- Píxeles sociales (medición, no el propio servicio) ---
connect.facebook.net
pixel.facebook.com
tr.snapchat.com
sc-static.net
analytics.tiktok.com
business-api.tiktok.com
ads.linkedin.com
px.ads.linkedin.com
snap.licdn.com
analytics.twitter.com
static.ads-twitter.com
t.co/i/adsct
ct.pinterest.com
analytics.pinterest.com
redditstatic.com/ads

# --- Antifraude/telemetría invasiva frecuente ---
cdn.jsdelivr.net/npm/ads
sentry.io/api
bugsnag.com
logrocket.com
logrocket.io
lr-ingest.io
smartlook.com/sdk
userzoom.com
survicate.com
`;

export class AdBlocker {
  private enabled = true;
  private startedAt = Date.now();

  /** Dominios de la lista incluida (coincidencia por sufijo). */
  private builtinHosts = new Set<string>();
  /** Dominios de las listas importadas por el usuario. */
  private customHosts = new Set<string>();
  /** Patrones con comodines o rutas. */
  private builtinPatterns: RegExp[] = [];
  private customPatterns: RegExp[] = [];

  private totalBlocked = 0;
  private perPartition = new Map<string, number>();
  private hostCounts = new Map<string, number>();
  private customListPath: string | null = null;
  private customListLines = 0;

  constructor() {
    this.loadInto(DEFAULT_BLOCKLIST, false);
  }

  // -------------------------------------------------------------------------
  // Carga de listas
  // -------------------------------------------------------------------------

  /** Carga una lista en formato hosts o EasyList básico. */
  loadInto(content: string, custom: boolean): number {
    let applied = 0;
    for (const rawLine of content.split(/\r?\n/)) {
      if (this.addLine(rawLine, custom)) applied += 1;
    }
    if (custom) this.customListLines = applied;
    return applied;
  }

  private addLine(rawLine: string, custom: boolean): boolean {
    let line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!') || line.startsWith('[')) return false;

    // Formato hosts: "0.0.0.0 ejemplo.com" o "127.0.0.1 ejemplo.com"
    const hostsMatch = /^(?:0\.0\.0\.0|127\.0\.0\.1|::1)\s+(\S+)/.exec(line);
    if (hostsMatch) line = hostsMatch[1];

    // Excepciones de EasyList: no las soportamos, y decirlo es mejor que ignorarlas.
    if (line.startsWith('@@')) return false;

    // Ancla de dominio de EasyList: ||ejemplo.com^
    if (line.startsWith('||')) {
      line = line.slice(2);
      const anchor = line.indexOf('^');
      if (anchor >= 0) line = line.slice(0, anchor);
      if (!line.includes('*') && !line.includes('/')) return this.addHost(line, custom);
    }

    if (line.startsWith('|')) line = line.replace(/^\|+/, '');

    // Patrón con comodines o ruta: se compila a expresión regular.
    if (line.includes('*') || line.includes('/')) return this.addPattern(line, custom);

    return this.addHost(line, custom);
  }

  private addHost(host: string, custom: boolean): boolean {
    const clean = host.toLowerCase().replace(/^\.+/, '').replace(/\.+$/, '');
    if (!clean || clean.length > 253) return false;
    // Solo dominios: letras, dígitos, guiones y puntos.
    if (!/^[a-z0-9.-]+$/.test(clean)) return false;
    if (!clean.includes('.')) return false;
    if (NEVER_BLOCK.has(clean)) return false;

    if (custom) this.customHosts.add(clean);
    else this.builtinHosts.add(clean);
    return true;
  }

  private addPattern(pattern: string, custom: boolean): boolean {
    try {
      const escaped = pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      const regex = new RegExp(escaped, 'i');
      if (custom) this.customPatterns.push(regex);
      else this.builtinPatterns.push(regex);
      return true;
    } catch {
      return false;
    }
  }

  /** Reemplaza la lista importada por el usuario. */
  setCustomList(content: string, sourcePath: string | null): number {
    this.customHosts.clear();
    this.customPatterns = [];
    this.customListPath = sourcePath;
    return this.loadInto(content, true);
  }

  clearCustomList(): void {
    this.customHosts.clear();
    this.customPatterns = [];
    this.customListPath = null;
    this.customListLines = 0;
  }

  // -------------------------------------------------------------------------
  // Decisión
  // -------------------------------------------------------------------------

  shouldBlock(rawUrl: string): BlockDecision {
    if (!this.enabled) return { block: false, host: '' };

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return { block: false, host: '' };
    }

    if (!['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol)) return { block: false, host: '' };

    const host = parsed.hostname.toLowerCase();
    if (!host || NEVER_BLOCK.has(host)) return { block: false, host: '' };
    // Nunca bloqueamos direcciones IP ni la red local.
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.endsWith('.local')) return { block: false, host: '' };

    if (this.matchesHost(host)) return { block: true, host };

    for (const regex of this.customPatterns) {
      if (regex.test(rawUrl)) return { block: true, host };
    }
    for (const regex of this.builtinPatterns) {
      if (regex.test(rawUrl)) return { block: true, host };
    }

    return { block: false, host };
  }

  /** Coincidencia por sufijo: recorre las etiquetas del dominio. */
  private matchesHost(host: string): boolean {
    let candidate = host;
    while (candidate.includes('.')) {
      if (this.builtinHosts.has(candidate) || this.customHosts.has(candidate)) return true;
      candidate = candidate.slice(candidate.indexOf('.') + 1);
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Estado y estadísticas
  // -------------------------------------------------------------------------

  record(host: string, partition: string): void {
    this.totalBlocked += 1;
    this.perPartition.set(partition, (this.perPartition.get(partition) ?? 0) + 1);
    this.hostCounts.set(host, (this.hostCounts.get(host) ?? 0) + 1);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  clearStats(): void {
    this.totalBlocked = 0;
    this.perPartition.clear();
    this.hostCounts.clear();
    this.startedAt = Date.now();
  }

  status() {
    const topHosts = [...this.hostCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([host, count]) => ({ host, count }));

    return {
      enabled: this.enabled,
      totalBlocked: this.totalBlocked,
      since: this.startedAt,
      topHosts,
      rules: {
        builtin: this.builtinHosts.size + this.builtinPatterns.length,
        custom: this.customHosts.size + this.customPatterns.length,
        customSource: this.customListPath,
        customLines: this.customListLines,
      },
    };
  }
}
