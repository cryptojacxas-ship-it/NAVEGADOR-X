import { CapabilityProvider, globalProviderResolver } from '@/src/kernel/ProviderResolver';

export const TorNetworkProvider: CapabilityProvider = {
  id: 'provider-network-tor',
  name: 'Tor Circuit SOCKS5 Transport',
  capabilityType: 'network.routeRequest',
  priority: 100,
  supportsContext: (context?: any) => {
    if (!context) return false;
    if (typeof context === 'string' && context.endsWith('.onion')) return true;
    if (context.url && context.url.endsWith('.onion')) return true;
    if (context.transport === 'Tor' || context.useTor) return true;
    return false;
  },
  execute: async (context: any) => {
    const url = typeof context === 'string' ? context : context?.url || '';
    return {
      proxied: true,
      transport: 'Tor',
      circuitInfo: 'Guard -> Relay -> Exit (Anonymous Onion Routing)',
      resolvedUrl: url,
      latencyMs: Math.floor(180 + Math.random() * 220),
      securityLevel: 'MAXIMUM_ANONYMITY'
    };
  }
};

export const VPNNetworkProvider: CapabilityProvider = {
  id: 'provider-network-vpn',
  name: 'Encrypted WireGuard VPN Tunnel',
  capabilityType: 'network.routeRequest',
  priority: 50,
  supportsContext: (context?: any) => {
    if (!context) return false;
    return Boolean(context.useVPN || context.transport === 'VPN');
  },
  execute: async (context: any) => {
    const url = typeof context === 'string' ? context : context?.url || '';
    return {
      proxied: true,
      transport: 'VPN',
      circuitInfo: 'WireGuard AES-256 Tunnel (Zurich Node)',
      resolvedUrl: url,
      latencyMs: Math.floor(35 + Math.random() * 25),
      securityLevel: 'HIGH_ENCRYPTION'
    };
  }
};

export const DirectNetworkProvider: CapabilityProvider = {
  id: 'provider-network-direct',
  name: 'Clearnet Direct Socket Provider',
  capabilityType: 'network.routeRequest',
  priority: 1,
  supportsContext: () => true, // Fallback for all clearnet requests
  execute: async (context: any) => {
    const url = typeof context === 'string' ? context : context?.url || '';
    return {
      proxied: false,
      transport: 'Direct',
      circuitInfo: 'Direct Clearnet Socket',
      resolvedUrl: url,
      latencyMs: Math.floor(10 + Math.random() * 15),
      securityLevel: 'STANDARD'
    };
  }
};

export function registerDefaultNetworkProviders() {
  globalProviderResolver.registerProvider(TorNetworkProvider);
  globalProviderResolver.registerProvider(VPNNetworkProvider);
  globalProviderResolver.registerProvider(DirectNetworkProvider);
}
