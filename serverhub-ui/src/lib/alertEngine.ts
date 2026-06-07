import type { Alert, AlertRule, SystemMetrics } from '../types';

/**
 * Derives live alerts from current metrics + alert rules.
 *
 * Each potential incident has a stable key (e.g. `disk:/data`). An alert is
 * created the moment a rule's threshold is breached, and is automatically
 * marked resolved once the underlying condition clears — re-breaching later
 * reopens the same entry rather than spamming duplicates.
 */
export function evaluateAlerts(metrics: SystemMetrics, rules: AlertRule[], existing: Alert[]): { alerts: Alert[]; changed: boolean } {
  const byKey = new Map(existing.map((a) => [a.id, a]));
  const server = metrics.hostname || 'this-server';
  let changed = false;

  const upsert = (key: string, breached: boolean, build: () => Pick<Alert, 'type' | 'severity' | 'title' | 'message'>) => {
    const current = byKey.get(key);
    if (breached) {
      if (!current || current.resolved) {
        byKey.set(key, { id: key, resolved: false, timestamp: new Date().toISOString(), server, ...build() });
        changed = true;
      }
    } else if (current && !current.resolved) {
      byKey.set(key, { ...current, resolved: true });
      changed = true;
    }
  };

  const ruleFor = (type: AlertRule['type']) => rules.find((r) => r.type === type && r.enabled);

  const cpuRule = ruleFor('cpu');
  if (cpuRule) {
    upsert('cpu:usage', metrics.cpu.usage > cpuRule.threshold, () => ({
      type: 'cpu',
      severity: metrics.cpu.usage > cpuRule.threshold + 10 ? 'critical' : 'warning',
      title: 'High CPU Usage',
      message: `CPU usage is at ${metrics.cpu.usage.toFixed(1)}% (threshold ${cpuRule.threshold}%)`,
    }));
  }

  const memRule = ruleFor('memory');
  if (memRule) {
    upsert('memory:usage', metrics.memory.usage > memRule.threshold, () => ({
      type: 'memory',
      severity: metrics.memory.usage > memRule.threshold + 5 ? 'critical' : 'warning',
      title: 'High Memory Usage',
      message: `Memory usage is at ${metrics.memory.usage.toFixed(1)}% (threshold ${memRule.threshold}%)`,
    }));
  }

  const diskRule = ruleFor('disk');
  if (diskRule) {
    for (const d of metrics.disk ?? []) {
      upsert(`disk:${d.mountpoint}`, d.usage > diskRule.threshold, () => ({
        type: 'disk',
        severity: d.usage > 90 ? 'critical' : 'warning',
        title: 'Low Disk Space',
        message: `${d.mountpoint} is ${d.usage.toFixed(0)}% full (${d.used.toFixed(0)} MB / ${d.total.toFixed(0)} MB used)`,
      }));
    }
  }

  const serviceRule = ruleFor('service');
  if (serviceRule) {
    for (const svc of metrics.services ?? []) {
      upsert(`service:${svc.name}`, svc.status === 'failed', () => ({
        type: 'service',
        severity: 'critical',
        title: 'Service Failed',
        message: `${svc.name} is in a failed state${svc.description ? ` — ${svc.description}` : ''}`,
      }));
    }
  }

  const dockerRule = ruleFor('docker');
  if (dockerRule) {
    for (const c of metrics.docker ?? []) {
      upsert(`docker:${c.name}`, c.status !== 'running' && c.status !== 'paused', () => ({
        type: 'docker',
        severity: 'critical',
        title: 'Container Stopped',
        message: `Container ${c.name} (${c.image}) is ${c.status}`,
      }));
    }
  }

  const alerts = [...byKey.values()].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return { alerts, changed };
}
