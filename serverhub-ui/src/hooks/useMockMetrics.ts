import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  MOCK_METRICS, MOCK_ALERTS, MOCK_ALERT_RULES, MOCK_CRON_JOBS
} from '../data/mockData';
import type { SystemMetrics } from '../types';

function jitter(base: number, pct = 0.08): number {
  return base + (Math.random() - 0.5) * base * pct;
}

function buildLiveMetrics(): SystemMetrics {
  return {
    ...MOCK_METRICS,
    cpu: {
      ...MOCK_METRICS.cpu,
      usage: jitter(MOCK_METRICS.cpu.usage, 0.3),
      frequency: jitter(MOCK_METRICS.cpu.frequency, 0.05),
    },
    memory: {
      ...MOCK_METRICS.memory,
      usage: jitter(MOCK_METRICS.memory.usage, 0.05),
      used: jitter(MOCK_METRICS.memory.used, 0.05),
    },
    load: {
      ...MOCK_METRICS.load,
      load1: jitter(MOCK_METRICS.load.load1, 0.2),
    },
    network: {
      ...MOCK_METRICS.network,
      interfaces: MOCK_METRICS.network.interfaces.map((iface) => ({
        ...iface,
        rxRate: jitter(iface.rxRate, 0.3),
        txRate: jitter(iface.txRate, 0.3),
      })),
    },
    temperatures: MOCK_METRICS.temperatures.map((t) => ({
      ...t,
      temperature: jitter(t.temperature, 0.05),
    })),
  };
}

export function useMockMetrics() {
  const { setMetrics, setAlerts, setAlertRules, setCronJobs } = useStore();

  useEffect(() => {
    setAlerts(MOCK_ALERTS);
    setAlertRules(MOCK_ALERT_RULES);
    setCronJobs(MOCK_CRON_JOBS);

    const tick = () => setMetrics(buildLiveMetrics());
    tick();
    const interval = setInterval(tick, 3000);
    return () => clearInterval(interval);
  }, [setMetrics, setAlerts, setAlertRules, setCronJobs]);
}
