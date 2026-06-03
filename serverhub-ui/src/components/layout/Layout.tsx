import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useStore } from '../../store/useStore';
import Dashboard from '../dashboard/Dashboard';
import SSHTerminal from '../ssh/SSHTerminal';
import SFTPClient from '../sftp/SFTPClient';
import CronManager from '../cron/CronManager';
import AlertCenter from '../alerts/AlertCenter';
import SettingsPage from '../settings/Settings';
import ProcessesView from '../views/ProcessesView';
import ServicesView from '../views/ServicesView';
import DockerView from '../views/DockerView';

export function Layout() {
  const { activeView } = useStore();

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'ssh': return <SSHTerminal />;
      case 'sftp': return <SFTPClient />;
      case 'cron': return <CronManager />;
      case 'alerts': return <AlertCenter />;
      case 'processes': return <ProcessesView />;
      case 'services': return <ServicesView />;
      case 'docker': return <DockerView />;
      case 'settings': return <SettingsPage />;
      default: return (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
          <div className="text-center">
            <div className="text-4xl mb-3">🚧</div>
            <div className="text-lg font-medium">Coming Soon</div>
            <div className="text-sm mt-1">This section is under development</div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex h-full bg-[var(--bg-primary)]">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
