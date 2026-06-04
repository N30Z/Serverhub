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

interface WCardProps {
  children: React.ReactNode;
  span?: number;
  rowSpan?: number;
  onClick?: () => void;
  editing?: boolean;
}

function WCard({ children, span = 3, rowSpan = 1, onClick, editing }: WCardProps) {
  return (
    <div
      className={`card card-hover group overflow-hidden ${editing ? 'ring-2 ring-[var(--accent-blue)] ring-opacity-40' : ''}`}
      style={{ gridColumn: `span ${span}`, gridRow: `span ${rowSpan}` }}
      onClick={!editing ? onClick : undefined}
    >
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { metrics, isEditingDashboard, dashboardVariant } = useStore();
  const [detailWidget, setDetailWidget] = useState<WidgetType | null>(null);
  const open = (type: WidgetType) => () => setDetailWidget(type);
  const edit = isEditingDashboard;

  if (!metrics) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-[var(--text-secondary)]" style={{ fontFamily: 'var(--ui)' }}>
            Connecting to agent...
          </div>
        </div>
      </div>
    );
  }

  const isChart = dashboardVariant === 'chart';

  return (
    <div className="h-full overflow-y-auto p-4">
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridAutoRows: '88px',
        }}
      >
        {/* ── Row A: quick-glance KPIs (3 cols each) ── */}
        <WCard span={3} rowSpan={2} onClick={open('cpu')} editing={edit}>
          <CpuWidget onOpenDetail={open('cpu')} isEditing={edit} variant={isChart ? 'chart' : 'number'} />
        </WCard>
        <WCard span={3} rowSpan={2} onClick={open('memory')} editing={edit}>
          <MemoryWidget onOpenDetail={open('memory')} isEditing={edit} variant={isChart ? 'chart' : 'number'} />
        </WCard>
        <WCard span={3} rowSpan={2} onClick={open('network')} editing={edit}>
          <NetworkWidget onOpenDetail={open('network')} isEditing={edit} variant={isChart ? 'chart' : 'number'} />
        </WCard>
        <WCard span={3} rowSpan={2} onClick={open('uptime')} editing={edit}>
          <UptimeWidget onOpenDetail={open('uptime')} isEditing={edit} />
        </WCard>

        {/* ── Row B: secondary metrics (3 cols each) ── */}
        <WCard span={3} rowSpan={3} onClick={open('load')} editing={edit}>
          <LoadWidget onOpenDetail={open('load')} isEditing={edit} variant={isChart ? 'chart' : 'number'} />
        </WCard>
        <WCard span={3} rowSpan={3} onClick={open('temperature')} editing={edit}>
          <TempWidget onOpenDetail={open('temperature')} isEditing={edit} />
        </WCard>
        <WCard span={3} rowSpan={3} onClick={open('disk')} editing={edit}>
          <DiskWidget onOpenDetail={open('disk')} isEditing={edit} />
        </WCard>
        <WCard span={3} rowSpan={3} onClick={open('filesystems')} editing={edit}>
          <FilesystemsWidget onOpenDetail={open('filesystems')} isEditing={edit} />
        </WCard>

        {/* ── Row C: detail tables ── */}
        <WCard span={5} rowSpan={4} onClick={open('processes')} editing={edit}>
          <ProcessesWidget onOpenDetail={open('processes')} isEditing={edit} />
        </WCard>
        <WCard span={4} rowSpan={4} onClick={open('docker')} editing={edit}>
          <DockerWidget onOpenDetail={open('docker')} isEditing={edit} />
        </WCard>
        <WCard span={3} rowSpan={4} onClick={open('users')} editing={edit}>
          <UsersWidget onOpenDetail={open('users')} isEditing={edit} />
        </WCard>

        {/* ── Row D: services + swap ── */}
        <WCard span={8} rowSpan={3} onClick={open('services')} editing={edit}>
          <ServicesWidget onOpenDetail={open('services')} isEditing={edit} expanded />
        </WCard>
        <WCard span={4} rowSpan={3} onClick={open('memory')} editing={edit}>
          <SwapMemMapWidget onOpenDetail={open('memory')} isEditing={edit} />
        </WCard>
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

/* ── Swap + Memory Map mini-widget (row D right) ── */
function SwapMemMapWidget({ onOpenDetail, isEditing }: { onOpenDetail: () => void; isEditing: boolean }) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;
  const { memory, swap } = metrics;

  const segments = [
    { label: 'Used', value: memory.used, color: 'var(--accent-red)', pct: memory.usage },
    { label: 'Cached', value: memory.cached, color: 'var(--accent-blue)', pct: (memory.cached / memory.total) * 100 },
    { label: 'Buffers', value: memory.buffers, color: 'var(--accent-purple)', pct: (memory.buffers / memory.total) * 100 },
    { label: 'Free', value: memory.free, color: 'var(--bg-hover)', pct: (memory.free / memory.total) * 100 },
  ];

  function fmt(mb: number) {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb} MB`;
  }

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <div className="flex flex-col h-full px-3 pt-3 pb-3">
        <div className="metric-label mb-2">Memory Map</div>

        {/* Stacked bar */}
        <div className="h-4 rounded-full overflow-hidden flex mb-3" style={{ background: 'var(--bg-hover)' }}>
          {segments.filter((s) => s.label !== 'Free').map((seg) => (
            <div
              key={seg.label}
              style={{ width: `${seg.pct}%`, background: seg.color, transition: 'width 0.5s ease' }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] mb-3">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
              <span className="text-[var(--text-muted)]">{seg.label}</span>
              <span className="text-[var(--text-secondary)] font-mono ml-auto">{fmt(seg.value)}</span>
            </div>
          ))}
        </div>

        {/* Swap */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-[var(--text-muted)]">Swap</span>
            <span className="font-mono text-[var(--text-secondary)]">{fmt(swap.used)} / {fmt(swap.total)}</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${swap.usage}%`, background: 'var(--accent-cyan)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
