import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { WidgetDetailModal } from './WidgetDetailModal';
import { CpuWidget } from './widgets/CpuWidget';
import { MemoryWidget } from './widgets/MemoryWidget';
import { NetworkWidget } from './widgets/NetworkWidget';
import { UptimeWidget } from './widgets/UptimeWidget';
import { LoadWidget } from './widgets/LoadWidget';
import { DiskWidget } from './widgets/DiskWidget';
import { TempWidget } from './widgets/TempWidget';
import { ProcessesWidget } from './widgets/ProcessesWidget';
import { ServicesWidget } from './widgets/ServicesWidget';
import { DockerWidget } from './widgets/DockerWidget';
import { FilesystemsWidget } from './widgets/FilesystemsWidget';
import { UsersWidget } from './widgets/UsersWidget';
import type { WidgetType } from '../../types';

function renderWidget(type: WidgetType, onOpen: () => void, editing: boolean) {
  const props = { onOpenDetail: onOpen, isEditing: editing };
  switch (type) {
    case 'cpu': return <CpuWidget {...props} />;
    case 'memory': return <MemoryWidget {...props} />;
    case 'network': return <NetworkWidget {...props} />;
    case 'uptime': return <UptimeWidget {...props} />;
    case 'load': return <LoadWidget {...props} />;
    case 'disk': return <DiskWidget {...props} />;
    case 'temperature': return <TempWidget {...props} />;
    case 'processes': return <ProcessesWidget {...props} />;
    case 'services': return <ServicesWidget {...props} />;
    case 'docker': return <DockerWidget {...props} />;
    case 'filesystems': return <FilesystemsWidget {...props} />;
    case 'users': return <UsersWidget {...props} />;
    default: return <div className="p-4 text-[var(--text-muted)]">Widget: {type}</div>;
  }
}

export default function Dashboard() {
  const { widgets, isEditingDashboard, metrics } = useStore();
  const [detailWidget, setDetailWidget] = useState<WidgetType | null>(null);

  if (!metrics) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[var(--text-secondary)]">Connecting to agent...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridAutoRows: '80px',
        }}
      >
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className={`card card-hover animate-fade-in overflow-hidden cursor-pointer ${isEditingDashboard ? 'ring-2 ring-[var(--accent-blue)] ring-opacity-40' : ''}`}
            style={{
              gridColumn: `span ${widget.w}`,
              gridRow: `span ${widget.h}`,
            }}
            onClick={() => !isEditingDashboard && setDetailWidget(widget.type)}
          >
            {isEditingDashboard && (
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                <div className="w-5 h-5 rounded bg-[var(--bg-hover)] flex items-center justify-center cursor-move">
                  <span className="text-[8px] text-[var(--text-muted)]">⠿</span>
                </div>
              </div>
            )}
            {renderWidget(widget.type, () => setDetailWidget(widget.type), isEditingDashboard)}
          </div>
        ))}
      </div>

      {detailWidget && (
        <WidgetDetailModal
          widgetType={detailWidget}
          onClose={() => setDetailWidget(null)}
        />
      )}
    </div>
  );
}
