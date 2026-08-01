import { kernel, BrowserKernel } from '@/src/kernel/BrowserKernel';
import { BrowserPlugin, BrowserPluginManifest } from '@/src/kernel/types';
import downloadManifest from './manifests/downloadService.manifest.json';

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  sizeBytes: number;
  downloadedBytes: number;
  status: 'Downloading' | 'Paused' | 'Completed' | 'Cancelled';
  speedKbps: number;
}

export class DownloadServicePlugin {
  private activeDownloads: Map<string, DownloadItem> = new Map();
  public pluginInstance: BrowserPlugin | null = null;

  public async register(k: BrowserKernel = kernel): Promise<BrowserPlugin> {
    const manifest = downloadManifest as BrowserPluginManifest;

    const executors = {
      'download.start': async (params: { url: string; filename?: string; sizeBytes?: number }) => {
        const id = `dl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const filename = params.filename || params.url.split('/').pop() || 'file_download.bin';
        const item: DownloadItem = {
          id,
          filename,
          url: params.url,
          sizeBytes: params.sizeBytes || 10485760, // 10MB default
          downloadedBytes: 0,
          status: 'Downloading',
          speedKbps: 1024,
        };

        this.activeDownloads.set(id, item);
        k.eventBus.publish('download.started', { item }, 'DownloadServicePlugin');
        return item;
      },

      'download.pause': async (downloadId: string) => {
        const item = this.activeDownloads.get(downloadId);
        if (item) {
          item.status = 'Paused';
          item.speedKbps = 0;
          k.eventBus.publish('download.paused', { item }, 'DownloadServicePlugin');
          return true;
        }
        return false;
      },

      'download.resume': async (downloadId: string) => {
        const item = this.activeDownloads.get(downloadId);
        if (item) {
          item.status = 'Downloading';
          item.speedKbps = 2048;
          k.eventBus.publish('download.resumed', { item }, 'DownloadServicePlugin');
          return true;
        }
        return false;
      },

      'download.cancel': async (downloadId: string) => {
        const item = this.activeDownloads.get(downloadId);
        if (item) {
          item.status = 'Cancelled';
          k.eventBus.publish('download.cancelled', { downloadId }, 'DownloadServicePlugin');
          this.activeDownloads.delete(downloadId);
          return true;
        }
        return false;
      }
    };

    this.pluginInstance = await k.registerPluginFromManifest(manifest, executors, {
      onEnable: () => {
        console.log(`[DownloadServicePlugin] Enabled: ${manifest.name}`);
      },
      onDisable: () => {
        console.log(`[DownloadServicePlugin] Disabled: ${manifest.name}`);
        this.activeDownloads.clear();
      },
      configure: (config) => {
        console.log(`[DownloadServicePlugin] Config updated:`, config);
      }
    });

    return this.pluginInstance;
  }

  public getActiveDownloads(): DownloadItem[] {
    return Array.from(this.activeDownloads.values());
  }
}

export const downloadServicePlugin = new DownloadServicePlugin();
