import {
  LayoutDashboard, Terminal, FolderOpen, Clock, Bell,
  Settings, ChevronLeft, ChevronRight, Server, Activity,
  Shield, Database, Cpu, HardDrive, Container, LogOut,
  Menu
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'ssh', label: 'SSH Terminal', icon: Terminal, group: 'main' },
  { id: 'sftp', label: 'File Manager', icon: FolderOpen, group: 'main' },
  { id: 'cron', label: 'Cron Jobs', icon: Clock, group: 'main' },
  { id: 'alerts', label: 'Alert Center', icon: Bell, group: 'monitoring' },
  { id: 'processes', label: 'Processes', icon: Activity, group: 'monitoring' },
  { id: 'services', label: 'Services', icon: Server, group: 'monitoring' },
  { id: 'docker', label: 'Docker', icon: Container, group: 'monitoring' },
  { id: 'storage', label: 'Storage', icon: HardDrive, group: 'system' },
  { id: 'network', label: 'Network', icon: Cpu, group: 'system' },
  { id: 'security', label: 'Security', icon: Shield, group: 'system' },
  { id: 'logs', label: 'Logs', icon: Database, group: 'system' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'config' },
];

const GROUP_LABELS: Record<string, string> = {
  main: 'Main',
  monitoring: 'Monitoring',
  system: 'System',
  config: 'Configuration',
};

export function Sidebar() {
  const { activeView, setActiveView, isSidebarCollapsed, toggleSidebar, alerts, metrics } = useStore();
  const unreadAlerts = alerts.filter((a) => !a.resolved).length;

  const groups = ['main', 'monitoring', 'system', 'config'];

  return (
    <aside
      className={clsx(
        'flex flex-col border-r transition-all duration-300 ease-in-out flex-shrink-0',
        'border-[var(--border)] bg-[var(--bg-secondary)]',
        isSidebarCollapsed ? 'w-[56px]' : 'w-[220px]'
      )}
      style={{ height: '100%' }}
    >
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 px-3 py-4 border-b border-[var(--border)]',
        isSidebarCollapsed && 'justify-center px-0'
      )}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1d63ed, #7c3aed)' }}>
          <Server size={16} className="text-white" />
        </div>
        {!isSidebarCollapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold text-white tracking-tight">ServerHub</div>
            <div className="text-[10px] text-[var(--text-muted)] truncate">{metrics?.hostname || 'connecting...'}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3" style={{ scrollbarWidth: 'none' }}>
        {groups.map((group) => {
          const items = NAV_ITEMS.filter((n) => n.group === group);
          return (
            <div key={group} className="mb-1">
              {!isSidebarCollapsed && (
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-3 py-2">
                  {GROUP_LABELS[group]}
                </div>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    className={clsx(
                      'sidebar-item w-full text-left mb-0.5',
                      isActive && 'active',
                      isSidebarCollapsed && 'justify-center px-0 py-2.5'
                    )}
                    onClick={() => setActiveView(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                  >
                    <span className="relative flex-shrink-0">
                      <Icon size={16} />
                      {item.id === 'alerts' && unreadAlerts > 0 && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--accent-red)] rounded-full text-[8px] flex items-center justify-center text-white font-bold">
                          {unreadAlerts > 9 ? '9+' : unreadAlerts}
                        </span>
                      )}
                    </span>
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
              {!isSidebarCollapsed && group !== 'config' && (
                <div className="mx-3 my-2 border-t border-[var(--border-subtle)]" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border)] p-2 flex flex-col gap-1">
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)]">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1d63ed, #7c3aed)' }}>
              A
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">admin</div>
              <div className="text-[10px] text-[var(--text-muted)]">Administrator</div>
            </div>
            <button className="text-[var(--text-muted)] hover:text-[var(--accent-red)] transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        )}
        <button
          className="sidebar-item w-full justify-center"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed
            ? <ChevronRight size={16} />
            : <><ChevronLeft size={16} /><span className="text-xs">Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
