import { kernel, BrowserKernel } from '@/src/kernel/BrowserKernel';
import { BrowserPlugin, BrowserPluginManifest } from '@/src/kernel/types';
import privacyManifest from './manifests/privacyService.manifest.json';

export class PrivacyServicePlugin {
  private isCanvasNoiseActive: boolean = true;
  private isWebRTCIsolated: boolean = true;
  private blockedCount: number = 0;
  public pluginInstance: BrowserPlugin | null = null;

  public async register(k: BrowserKernel = kernel): Promise<BrowserPlugin> {
    const manifest = privacyManifest as BrowserPluginManifest;

    const executors = {
      'privacy.blockTracker': async (params: { domain: string; tracker: string; type: string }) => {
        this.blockedCount++;
        const eventData = {
          id: `trk-${Date.now()}`,
          domain: params.domain || 'unknown-domain.com',
          tracker: params.tracker || 'CanvasFingerprinter',
          type: params.type || 'Fingerprint',
          time: new Date().toLocaleTimeString(),
          protectedData: 'Inyección de Ruido Sintético'
        };

        k.eventBus.publish('privacy.threat_blocked', eventData, 'PrivacyServicePlugin');
        return eventData;
      },

      'privacy.toggleCanvasNoise': async (enabled?: boolean) => {
        this.isCanvasNoiseActive = enabled !== undefined ? enabled : !this.isCanvasNoiseActive;
        k.eventBus.publish('privacy.canvas_noise_changed', { active: this.isCanvasNoiseActive }, 'PrivacyServicePlugin');
        return { active: this.isCanvasNoiseActive };
      },

      'privacy.isolateWebRTC': async (enabled?: boolean) => {
        this.isWebRTCIsolated = enabled !== undefined ? enabled : !this.isWebRTCIsolated;
        k.eventBus.publish('privacy.webrtc_isolation_changed', { active: this.isWebRTCIsolated }, 'PrivacyServicePlugin');
        return { active: this.isWebRTCIsolated };
      }
    };

    this.pluginInstance = await k.registerPluginFromManifest(manifest, executors, {
      onEnable: () => {
        console.log(`[PrivacyServicePlugin] Enabled: ${manifest.name}`);
      },
      onDisable: () => {
        console.log(`[PrivacyServicePlugin] Disabled: ${manifest.name}`);
      },
      configure: (config) => {
        if (config.canvasNoiseLevel !== undefined) {
          this.isCanvasNoiseActive = config.canvasNoiseLevel > 0;
        }
        if (config.isolateWebRTC !== undefined) {
          this.isWebRTCIsolated = config.isolateWebRTC;
        }
      }
    });

    return this.pluginInstance;
  }

  public getStats() {
    return {
      blockedCount: this.blockedCount,
      isCanvasNoiseActive: this.isCanvasNoiseActive,
      isWebRTCIsolated: this.isWebRTCIsolated,
    };
  }
}

export const privacyServicePlugin = new PrivacyServicePlugin();
