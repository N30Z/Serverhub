import { Bell, Sun, Moon, RefreshCw, Wifi, WifiOff, Edit2, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { clsx } from 'clsx';

const VIEW_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  ssh: 'SSH Terminal',
  sftp: 'File Manager',
  cron: 'Cron Jobs',
  alerts: 'Alert Center',
  processes: 'Processes',
  services: 'Services',
  docker: 'Docker',
  storage: 'Storage',
  network: 'Network',
  security: 'Security',
  logs: 'System Logs',
  settings: 'Settings',
};

export function TopBar() {
  const { activeView, theme, setTheme, alerts, metrics, isEditingDashboard, toggleEditDashboard } = useStore();
  const unreadAlerts = alerts.filter((a) => !a.resolved).length;
  const isConnected = !!metrics;

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white">
          {VIEW_TITLES[activeView] || activeView}
        </h1>

        {activeView === 'dashboard' && (
          <button
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              isEditingDashboard
                ? 'bg-[var(--accent-green)] bg-opacity-20 text-[var(--accent-green)] border border-[var(--accent-green)] border-opacity-30'
                : 'btn-secondary text-xs py-1'
            )}
            onClick={toggleEditDashboard}
          >
            {isEditingDashboard ? <><Check size={12} /> Done</>  : <><Edit2 size={12} /> Edit Layout</>}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Connection status */}
        <div className={clsx(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs',
          isConnected
            ? 'text-[var(--accent-green)] bg-[rgba(63,185,80,0.1)]'
            : 'text-[var(--text-muted)] bg-[var(--bg-tertiary)]'
        )}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
        </div>

        {/* Refresh indicator */}
        <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
          <RefreshCw size={11} className={isConnected ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
          <span>Live</span>
        </div>

        {/* Theme toggle */}
        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] transition-colors"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Alerts bell */}
        <button
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] transition-colors"
          onClick={() => useStore.getState().setActiveView('alerts')}
        >
          <Bell size={14} />
          {unreadAlerts > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-red)] rounded-full animate-pulse-dot" />
          )}
        </button>

        {/* Server info */}
        {metrics && (
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[var(--border)]">
            <div className="text-right">
              <div className="text-xs font-medium text-white">{metrics.hostname}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{metrics.os}</div>
            </div>
            <div className="status-dot status-online animate-pulse-dot" />
          </div>
        )}
      </div>
    </header>
  );
}
