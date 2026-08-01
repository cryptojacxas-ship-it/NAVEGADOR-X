export type LayerType = 'UX' | 'Kernel' | 'Services' | 'Network' | 'Renderer' | 'OS';

export interface KernelEvent<T = any> {
  id: string;
  type: string;
  payload: T;
  source: string;
  timestamp: number;
}

export type EventListener<T = any> = (event: KernelEvent<T>) => void;

export interface RendererTab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  favicon?: string;
  active: boolean;
}

export interface RendererProvider {
  id: string;
  name: string;
  type: 'Iframe' | 'WebView2' | 'CEF' | 'QtWebEngine' | 'Servo';
  initialize(): Promise<void>;
  createTab(url?: string): Promise<RendererTab>;
  navigate(tabId: string, url: string): Promise<void>;
  reload(tabId: string): Promise<void>;
  stop(tabId: string): Promise<void>;
  executeScript<T = any>(tabId: string, script: string): Promise<T>;
  captureScreenshot?(tabId: string): Promise<string>;
  destroy(): Promise<void>;
}

export interface NetworkProvider {
  id: string;
  name: string;
  protocol: 'Direct' | 'Tor' | 'VPN' | 'SOCKS5' | 'HTTP_Proxy';
  status: 'Connected' | 'Connecting' | 'Disconnected' | 'Error';
  circuitInfo?: string;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  routeRequest(url: string): Promise<{ proxied: boolean; transport: string }>;
}

export interface CapabilityMetadata {
  version?: string;
  category?: 'network' | 'privacy' | 'storage' | 'system' | 'ai' | 'media' | 'security' | string;
  permissions?: string[];
  supportedTransports?: Array<'Direct' | 'Tor' | 'VPN' | 'SOCKS5' | 'HTTP_Proxy' | string>;
  timeoutMs?: number;
  auditRequired?: boolean;
}

export interface BrowserCapability {
  name: string;
  serviceId: string;
  description: string;
  metadata?: CapabilityMetadata;
  execute: (...args: any[]) => Promise<any>;
}

export interface BrowserService {
  id: string;
  name: string;
  version: string;
  initialize(kernel: any): Promise<void>;
  shutdown(): Promise<void>;
  getCapabilities(): BrowserCapability[];
}

export interface PolicyRule {
  id: string;
  name: string;
  targetCapability: string;
  condition: (callerId: string, context?: any) => boolean;
  action: 'ALLOW' | 'DENY' | 'AUDIT';
  reason?: string;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  ruleName?: string;
  reason?: string;
}

export interface ManifestCapabilityDefinition {
  name: string;
  description: string;
  version?: string;
  category?: string;
  permissions?: string[];
  supportedTransports?: string[];
  timeoutMs?: number;
  auditRequired?: boolean;
}

export interface BrowserPluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
  capabilities: ManifestCapabilityDefinition[];
  config?: Record<string, any>;
}

export interface BrowserPlugin {
  manifest: BrowserPluginManifest;
  id: string;
  name: string;
  version: string;
  author: string;
  permissions: string[];
  capabilities: BrowserCapability[];
  config?: Record<string, any>;
  onEnable(kernel: any): void | Promise<void>;
  onDisable(kernel: any): void | Promise<void>;
  configure?(config: Record<string, any>): void;
}
