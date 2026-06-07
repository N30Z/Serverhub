import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import {
  MOCK_METRICS, MOCK_ALERT_RULES, MOCK_CRON_JOBS,
} from '../data/mockData';
import { evaluateAlerts } from '../lib/alertEngine';
import { fetchCronJobs } from '../lib/api';
import type { SystemMetrics } from '../types';

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

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useMockMetrics() {
  const { setMetrics, setAlerts, setAlertRules, setCronJobs, authToken } = useStore();
  const wsRef = useRef<WebSocket | null>(null);

  // Derives live alerts from the freshly-applied metrics + the current rules/alerts in
  // the store, so alerts reflect real system state rather than canned demo data.
  const applyMetrics = (next: SystemMetrics) => {
    setMetrics(next);
    const { alertRules, alerts } = useStore.getState();
    const { alerts: derived, changed } = evaluateAlerts(next, alertRules, alerts);
    if (changed) setAlerts(derived);
  };

  useEffect(() => {
    setAlertRules(MOCK_ALERT_RULES);

    // In production mode with a valid auth token, connect to the real agent WebSocket.
    // In dev mode (Vite dev server), fall back to mock data.
    if (import.meta.env.PROD && authToken) {
      // Real cron jobs come from the agent (reads crontabs); fall back to the
      // mock list if the request fails so the page still has something to show.
      fetchCronJobs()
        .then((jobs) => setCronJobs(jobs.length > 0 ? jobs : MOCK_CRON_JOBS))
        .catch(() => setCronJobs(MOCK_CRON_JOBS));

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const url = `${proto}//${window.location.host}/ws?token=${authToken}`;

      const connect = () => {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (evt) => {
          try {
            applyMetrics(JSON.parse(evt.data) as SystemMetrics);
          } catch { /* ignore malformed frames */ }
        };

        ws.onclose = () => {
          // Reconnect after 3 s if component is still mounted
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

    // Dev mode: poll mock data
    setCronJobs(MOCK_CRON_JOBS);
    const tick = () => applyMetrics(buildLiveMetrics());
    tick();
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [authToken, setMetrics, setAlerts, setAlertRules, setCronJobs]);
}
