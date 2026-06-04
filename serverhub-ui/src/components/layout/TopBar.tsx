import { Bell, Sun, Moon, RefreshCw, Wifi, WifiOff, Edit2, Check, BarChart2, Hash } from 'lucide-react';
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
  const {
    activeView, theme, setTheme, alerts, metrics,
    isEditingDashboard, toggleEditDashboard,
    dashboardVariant, setDashboardVariant,
  } = useStore();
  const unreadAlerts = alerts.filter((a) => !a.resolved).length;
  const isConnected = !!metrics;

  return (
    <header className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--ui)' }}>
          {VIEW_TITLES[activeView] || activeView}
        </h1>

        {activeView === 'dashboard' && (
          <div className="flex items-center gap-2">
            {/* A/B variant pill */}
            <div className="flex items-center gap-0.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg p-0.5">
              <button
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                  dashboardVariant === 'chart'
                    ? 'bg-[var(--bg-card)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-white'
                )}
                onClick={() => setDashboardVariant('chart')}
                title="Chart-heavy variant"
              >
                <BarChart2 size={11} />
                <span>Charts</span>
              </button>
              <button
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                  dashboardVariant === 'number'
                    ? 'bg-[var(--bg-card)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-white'
                )}
                onClick={() => setDashboardVariant('number')}
                title="Number-forward variant"
              >
                <Hash size={11} />
                <span>Numbers</span>
              </button>
            </div>

            <button
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border',
                isEditingDashboard
                  ? 'bg-[rgba(63,185,80,0.15)] text-[var(--accent-green)] border-[rgba(63,185,80,0.3)]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border)] hover:text-white'
              )}
              onClick={toggleEditDashboard}
            >
              {isEditingDashboard
                ? <><Check size={11} /> Done</>
                : <><Edit2 size={11} /> Edit Layout</>
              }
            </button>
          </div>
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

        <div className="flex items-center gap-1 text-[var(--text-muted)] text-xs">
          <RefreshCw size={11} className={isConnected ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
          <span>Live</span>
        </div>

        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] transition-colors"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)] transition-colors"
          onClick={() => useStore.getState().setActiveView('alerts')}
        >
          <Bell size={14} />
          {unreadAlerts > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-red)] rounded-full animate-pulse-dot" />
          )}
        </button>

        {metrics && (
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[var(--border)]">
            <div className="text-right">
              <div className="text-xs font-medium text-white" style={{ fontFamily: 'var(--ui)' }}>{metrics.hostname}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{metrics.os}</div>
            </div>
            <div className="status-dot status-online animate-pulse-dot" />
          </div>
        )}
      </div>
    </header>
  );
}
