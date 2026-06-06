import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SystemMetrics, Alert, AlertRule, CronJob, WidgetConfig, Theme } from '../types';

export type DashboardVariant = 'chart' | 'number';

interface AppState {
  theme: Theme;
  activeView: string;
  isSidebarCollapsed: boolean;
  metrics: SystemMetrics | null;
  alerts: Alert[];
  alertRules: AlertRule[];
  cronJobs: CronJob[];
  widgets: WidgetConfig[];
  isAuthenticated: boolean;
  authToken: string | null;
  serverName: string;
  isEditingDashboard: boolean;
  dashboardVariant: DashboardVariant;

  setTheme: (theme: Theme) => void;
  setActiveView: (view: string) => void;
  toggleSidebar: () => void;
  setMetrics: (metrics: SystemMetrics) => void;
  setAlerts: (alerts: Alert[]) => void;
  setAlertRules: (rules: AlertRule[]) => void;
  setCronJobs: (jobs: CronJob[]) => void;
  setWidgets: (widgets: WidgetConfig[]) => void;
  setAuthenticated: (auth: boolean) => void;
  setAuthToken: (token: string | null) => void;
  toggleEditDashboard: () => void;
  setDashboardVariant: (v: DashboardVariant) => void;
}

const defaultWidgets: WidgetConfig[] = [
  { id: 'cpu', type: 'cpu', title: 'CPU Usage', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { id: 'memory', type: 'memory', title: 'Memory', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { id: 'network', type: 'network', title: 'Network', x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { id: 'uptime', type: 'uptime', title: 'Uptime', x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
  { id: 'load', type: 'load', title: 'Load Average', x: 0, y: 2, w: 4, h: 3, minW: 3, minH: 2 },
  { id: 'disk', type: 'disk', title: 'Disk I/O', x: 4, y: 2, w: 4, h: 3, minW: 3, minH: 2 },
  { id: 'temperature', type: 'temperature', title: 'Temperatures', x: 8, y: 2, w: 4, h: 3, minW: 2, minH: 2 },
  { id: 'processes', type: 'processes', title: 'Top Processes', x: 0, y: 5, w: 6, h: 4, minW: 4, minH: 3 },
  { id: 'services', type: 'services', title: 'Services', x: 6, y: 5, w: 3, h: 4, minW: 2, minH: 3 },
  { id: 'docker', type: 'docker', title: 'Docker', x: 9, y: 5, w: 3, h: 4, minW: 2, minH: 3 },
  { id: 'filesystems', type: 'filesystems', title: 'Filesystems', x: 0, y: 9, w: 6, h: 3, minW: 4, minH: 2 },
  { id: 'users', type: 'users', title: 'Logged In Users', x: 6, y: 9, w: 6, h: 3, minW: 3, minH: 2 },
  { id: 'bandwidth', type: 'bandwidth', title: 'Bandwidth Monitor', x: 0, y: 12, w: 4, h: 3, minW: 3, minH: 2 },
  { id: 'logs', type: 'logs', title: 'Log Viewer', x: 4, y: 12, w: 4, h: 3, minW: 3, minH: 2 },
  { id: 'firewall', type: 'firewall', title: 'Firewall Rules', x: 8, y: 12, w: 4, h: 3, minW: 3, minH: 2 },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      activeView: 'dashboard',
      isSidebarCollapsed: false,
      metrics: null,
      alerts: [],
      alertRules: [],
      cronJobs: [],
      widgets: defaultWidgets,
      isAuthenticated: false,
      authToken: null,
      serverName: 'prod-server-01',
      isEditingDashboard: false,
      dashboardVariant: 'chart',

      setTheme: (theme) => set({ theme }),
      setActiveView: (activeView) => set({ activeView }),
      toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
      setMetrics: (metrics) => set({ metrics }),
      setAlerts: (alerts) => set({ alerts }),
      setAlertRules: (alertRules) => set({ alertRules }),
      setCronJobs: (cronJobs) => set({ cronJobs }),
      setWidgets: (widgets) => set({ widgets }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setAuthToken: (authToken) => set({ authToken }),
      toggleEditDashboard: () => set((s) => ({ isEditingDashboard: !s.isEditingDashboard })),
      setDashboardVariant: (dashboardVariant) => set({ dashboardVariant }),
    }),
    {
      name: 'serverhub-store',
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        authToken: s.authToken,
        theme: s.theme,
        dashboardVariant: s.dashboardVariant,
        widgets: s.widgets,
      }),
    },
  ),
);
