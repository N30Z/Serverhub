import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import {
  MOCK_METRICS, MOCK_ALERTS, MOCK_ALERT_RULES, MOCK_CRON_JOBS,
} from '../data/mockData';
import type { Alert, AlertRule, CronJob, SystemMetrics } from '../types';

// ── Dev-mode mock data ────────────────────────────────────────────────────────

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

async function fetchJSON<T>(path: string, token: string): Promise<T> {
  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json() as Promise<T>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useMockMetrics() {
  const { setMetrics, setAlerts, setAlertRules, setCronJobs, authToken } = useStore();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // In production mode with a valid auth token, connect to the real agent.
    if (import.meta.env.PROD && authToken) {
      // Fetch alerts, rules and cron jobs from real API endpoints
      fetchJSON<Alert[]>('/api/alerts', authToken)
        .then(setAlerts)
        .catch(() => setAlerts(MOCK_ALERTS));

      fetchJSON<AlertRule[]>('/api/alerts/rules', authToken)
        .then(setAlertRules)
        .catch(() => setAlertRules(MOCK_ALERT_RULES));

      fetchJSON<CronJob[]>('/api/cron', authToken)
        .then(setCronJobs)
        .catch(() => setCronJobs(MOCK_CRON_JOBS));

      // Connect to the real agent WebSocket for live metrics
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${window.location.host}/ws?token=${authToken}`;

      const connect = () => {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (evt) => {
          try {
            setMetrics(JSON.parse(evt.data) as SystemMetrics);
          } catch { /* ignore malformed frames */ }
        };

        ws.onclose = () => {
          setTimeout(() => {
            if (wsRef.current?.readyState !== WebSocket.OPEN) connect();
          }, 3000);
        };

        ws.onerror = () => ws.close();
      };

      connect();
      return () => {
        wsRef.current?.close();
        wsRef.current = null;
      };
    }

    // Dev mode: use mock data
    setAlerts(MOCK_ALERTS);
    setAlertRules(MOCK_ALERT_RULES);
    setCronJobs(MOCK_CRON_JOBS);

    const tick = () => setMetrics(buildLiveMetrics());
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [authToken, setMetrics, setAlerts, setAlertRules, setCronJobs]);
}
