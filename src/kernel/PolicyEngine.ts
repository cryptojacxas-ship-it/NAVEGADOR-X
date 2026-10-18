import { PolicyRule, PolicyEvaluationResult } from './types';
import { globalEventBus } from './EventBus';

export class PolicyEngine {
  private rules: Map<string, PolicyRule[]> = new Map();
  private auditLogs: { timestamp: number; callerId: string; capability: string; action: string; allowed: boolean }[] = [];

  constructor() {
    this.registerDefaultPolicies();
  }

  private registerDefaultPolicies(): void {
    // Default Rule: Tor Onion domain isolation
    this.addRule({
      id: 'pol-onion-isolation',
      name: 'Onion Domain Direct Leak Prevention',
      targetCapability: 'network.routeRequest',
      condition: (callerId, context) => {
        if (context?.url && context.url.endsWith('.onion')) {
          // Onion URLs must strictly route through Tor provider
          return context?.transport === 'Tor';
        }
        return true;
      },
      action: 'DENY',
      reason: 'Peticiones a dominios .onion deben enrutarse exclusivamente a través de la Red Tor SOCKS5.'
    });

    // Default Rule: Privacy Shield Canvas fingerprint protection
    this.addRule({
      id: 'pol-canvas-fingerprint',
      name: 'Canvas Fingerprint Interception Policy',
      targetCapability: 'privacy.canvas.read',
      condition: (callerId, context) => {
        // Enforce synthetic noise injection
        return true;
      },
      action: 'AUDIT',
      reason: 'Inyección de ruido sintético activa en lectura de Canvas 2D.'
    });
  }

  public addRule(rule: PolicyRule): void {
    if (!this.rules.has(rule.targetCapability)) {
      this.rules.set(rule.targetCapability, []);
    }
    this.rules.get(rule.targetCapability)!.push(rule);
  }

  public evaluate(capabilityName: string, callerId: string = 'system', context?: any): PolicyEvaluationResult {
    const capabilityRules = this.rules.get(capabilityName) || [];

    for (const rule of capabilityRules) {
      const isMet = rule.condition(callerId, context);

      if (rule.action === 'DENY' && !isMet) {
        this.logAudit(callerId, capabilityName, 'DENIED', false);
        globalEventBus.publish('policy.denied', { callerId, capabilityName, ruleName: rule.name, reason: rule.reason }, 'PolicyEngine');
        return {
          allowed: false,
          ruleName: rule.name,
          reason: rule.reason || 'Acceso denegado por política de seguridad del Kernel'
        };
      }

      if (rule.action === 'AUDIT') {
        this.logAudit(callerId, capabilityName, 'AUDITED', true);
      }
    }

    this.logAudit(callerId, capabilityName, 'ALLOWED', true);
    return { allowed: true };
  }

  private logAudit(callerId: string, capability: string, action: string, allowed: boolean): void {
    this.auditLogs.unshift({
      timestamp: Date.now(),
      callerId,
      capability,
      action,
      allowed
    });
    if (this.auditLogs.length > 50) this.auditLogs.pop();
  }

  public getAuditLogs() {
    return [...this.auditLogs];
  }
}

export const globalPolicyEngine = new PolicyEngine();
