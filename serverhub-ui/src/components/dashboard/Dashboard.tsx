import { useState, useCallback } from 'react';
import GridLayout, { useContainerWidth, verticalCompactor } from 'react-grid-layout';
import type { LayoutItem } from 'react-grid-layout';
import { GripVertical, Wifi, Terminal, Shield } from 'lucide-react';
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
import type { WidgetType, WidgetConfig } from '../../types';

// ── Coming Soon widget ───────────────────────────────────────────────────────

const COMING_SOON: Partial<Record<WidgetType, { icon: React.ReactNode; desc: string; color: string }>> = {
  bandwidth: {
    icon: <Wifi size={22} />,
    desc: 'Historical bandwidth graphs with per-interface breakdown and traffic shaping',
    color: 'var(--accent-cyan)',
  },
  logs: {
    icon: <Terminal size={22} />,
    desc: 'Real-time system log streaming with search, grep, and severity filters',
    color: 'var(--accent-purple)',
  },
  firewall: {
    icon: <Shield size={22} />,
    desc: 'iptables / nftables rule viewer with live hit counters and traffic stats',
    color: 'var(--accent-green)',
  },
};

function ComingSoonWidget({ type, title }: { type: WidgetType; title: string }) {
  const cfg = COMING_SOON[type];
  const color = cfg?.color ?? 'var(--accent-blue)';
  const icon = cfg?.icon ?? <Wifi size={22} />;
  const desc = cfg?.desc ?? 'This widget is under development.';

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 px-5 text-center select-none">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{title}</div>
        <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>{desc}</div>
      </div>
      <span
        className="text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
        style={{
          background: 'rgba(88,166,255,0.12)',
          color: 'var(--accent-blue)',
          border: '1px solid rgba(88,166,255,0.25)',
        }}
      >
        Coming Soon
      </span>
    </div>
  );
}

// ── Swap + Memory Map mini-widget ─────────────────────────────────────────────

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
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
  }

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <div className="flex flex-col h-full px-3 pt-3 pb-3">
        <div className="metric-label mb-2">Memory Map</div>
        <div className="h-4 rounded-full overflow-hidden flex mb-3" style={{ background: 'var(--bg-hover)' }}>
          {segments.filter((s) => s.label !== 'Free').map((seg) => (
            <div
              key={seg.label}
              style={{ width: `${seg.pct}%`, background: seg.color, transition: 'width 0.5s ease' }}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] mb-3">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
              <span className="text-[var(--text-muted)]">{seg.label}</span>
              <span className="text-[var(--text-secondary)] font-mono ml-auto">{fmt(seg.value)}</span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-[var(--text-muted)]">Swap</span>
            <span className="font-mono text-[var(--text-secondary)]">{fmt(swap.used)} / {fmt(swap.total)}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${swap.usage}%`, background: 'var(--accent-cyan)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { metrics, isEditingDashboard, dashboardVariant, widgets, setWidgets } = useStore();
  const [detailWidget, setDetailWidget] = useState<WidgetType | null>(null);
  const { width, containerRef } = useContainerWidth();

  const layoutItems: LayoutItem[] = widgets.map((w) => ({
    i: w.id,
    x: w.x,
    y: w.y,
    w: w.w,
    h: w.h,
    minW: w.minW,
    minH: w.minH,
  }));

  const persistLayout = useCallback(
    (newLayout: readonly LayoutItem[]) => {
      setWidgets(
        widgets.map((w) => {
          const item = newLayout.find((l) => l.i === w.id);
          return item ? { ...w, x: item.x, y: item.y, w: item.w, h: item.h } : w;
        }),
      );
    },
    [widgets, setWidgets],
  );

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

  function renderContent(w: WidgetConfig) {
    const edit = isEditingDashboard;
    const open = () => setDetailWidget(w.type);
    switch (w.type) {
      case 'cpu':         return <CpuWidget onOpenDetail={open} isEditing={edit} variant={isChart ? 'chart' : 'number'} />;
      case 'memory':      return <MemoryWidget onOpenDetail={open} isEditing={edit} variant={isChart ? 'chart' : 'number'} />;
      case 'network':     return <NetworkWidget onOpenDetail={open} isEditing={edit} variant={isChart ? 'chart' : 'number'} />;
      case 'uptime':      return <UptimeWidget onOpenDetail={open} isEditing={edit} />;
      case 'load':        return <LoadWidget onOpenDetail={open} isEditing={edit} variant={isChart ? 'chart' : 'number'} />;
      case 'temperature': return <TempWidget onOpenDetail={open} isEditing={edit} />;
      case 'disk':        return <DiskWidget onOpenDetail={open} isEditing={edit} />;
      case 'filesystems': return <FilesystemsWidget onOpenDetail={open} isEditing={edit} />;
      case 'processes':   return <ProcessesWidget onOpenDetail={open} isEditing={edit} />;
      case 'services':    return <ServicesWidget onOpenDetail={open} isEditing={edit} expanded />;
      case 'docker':      return <DockerWidget onOpenDetail={open} isEditing={edit} />;
      case 'users':       return <UsersWidget onOpenDetail={open} isEditing={edit} />;
      case 'swap':        return <SwapMemMapWidget onOpenDetail={open} isEditing={edit} />;
      default:            return <ComingSoonWidget type={w.type} title={w.title} />;
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div ref={containerRef}>
        <GridLayout
          width={width}
          layout={layoutItems}
          gridConfig={{
            cols: 12,
            rowHeight: 88,
            margin: [12, 12] as const,
            containerPadding: [0, 0] as const,
          }}
          dragConfig={{
            enabled: isEditingDashboard,
          }}
          resizeConfig={{
            enabled: isEditingDashboard,
            handles: ['se'] as const,
          }}
          compactor={verticalCompactor}
          onDragStop={(layout) => persistLayout(layout)}
          onResizeStop={(layout) => persistLayout(layout)}
          className={isEditingDashboard ? 'rgl-editing' : ''}
        >
          {widgets.map((w) => (
            <div
              key={w.id}
              className={[
                'card overflow-hidden',
                isEditingDashboard
                  ? 'ring-2 ring-[rgba(88,166,255,0.4)] select-none'
                  : 'card-hover cursor-pointer',
              ].join(' ')}
              style={{ position: 'relative' }}
              onClick={!isEditingDashboard ? () => setDetailWidget(w.type) : undefined}
            >
              {/* Drag handle strip — only in edit mode */}
              {isEditingDashboard && (
                <div
                  className="absolute inset-x-0 top-0 z-20 flex items-center gap-1.5 px-3 py-1.5 cursor-grab active:cursor-grabbing"
                  style={{
                    background: 'rgba(88,166,255,0.08)',
                    borderBottom: '1px solid rgba(88,166,255,0.15)',
                  }}
                >
                  <GripVertical size={12} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                  <span
                    className="text-[10px] font-medium truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {w.title}
                  </span>
                </div>
              )}

              {/* Widget content */}
              <div className={`h-full ${isEditingDashboard ? 'pt-[30px]' : ''}`}>
                {renderContent(w)}
              </div>
            </div>
          ))}
        </GridLayout>
      </div>

      {detailWidget && (
        <WidgetDetailModal widgetType={detailWidget} onClose={() => setDetailWidget(null)} />
      )}
    </div>
  );
}
