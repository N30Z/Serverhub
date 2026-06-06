import { X, TrendingUp, AlertCircle, Settings2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { WidgetType } from '../../types';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { formatBytes, getUsageColor, formatUptime } from './widgets/WidgetBase';

interface Props {
  widgetType: WidgetType;
  onClose: () => void;
}

const TITLES: Partial<Record<WidgetType, string>> = {
  cpu: 'CPU Usage',
  memory: 'Memory Usage',
  network: 'Network Traffic',
  load: 'System Load',
  disk: 'Disk I/O',
  temperature: 'Temperatures',
  processes: 'Processes',
  services: 'System Services',
  docker: 'Docker Containers',
  filesystems: 'Filesystems',
  users: 'Logged In Users',
  uptime: 'System Information',
};

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-lg font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
      {sub && <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</div>}
    </div>
  );
}

function CpuDetail({ metrics }: { metrics: NonNullable<ReturnType<typeof useStore.getState>['metrics']> }) {
  const { cpu } = metrics;
  const color = getUsageColor(cpu.usage);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Usage" value={`${cpu.usage.toFixed(1)}%`} color={color} />
        <StatCard label="Cores" value={String(cpu.cores)} />
        <StatCard label="Frequency" value={`${cpu.frequency.toFixed(2)} GHz`} />
        <StatCard label="Model" value={cpu.model.split(' ').slice(0, 2).join(' ')} sub={cpu.model} />
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">History (1 min)</div>
        <div className="h-40">
          <ResponsiveContainer>
            <AreaChart data={cpu.history ?? []}>
              <defs>
                <linearGradient id="cpuDetailGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(t) => new Date(t).toLocaleTimeString([], { second: '2-digit', minute: '2-digit' })} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`${(v as number).toFixed(1)}%`, 'CPU']} labelFormatter={(t) => new Date(t).toLocaleTimeString()} />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#cpuDetailGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Per-Core Usage</div>
        <div className="grid grid-cols-8 gap-1.5">
          {(cpu.perCore ?? []).map((c, i) => {
            const col = getUsageColor(c);
            return (
              <div key={i} className="text-center">
                <div className="h-12 rounded-sm overflow-hidden bg-[var(--bg-hover)] relative">
                  <div className="absolute bottom-0 left-0 right-0 transition-all" style={{ height: `${c}%`, background: col, opacity: 0.8 }} />
                </div>
                <div className="text-[9px] text-[var(--text-muted)] mt-0.5">C{i}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MemoryDetail({ metrics }: { metrics: NonNullable<ReturnType<typeof useStore.getState>['metrics']> }) {
  const { memory, swap } = metrics;
  const color = getUsageColor(memory.usage);
  const pieData = [
    { name: 'Used', value: memory.used, color: color },
    { name: 'Cached', value: memory.cached, color: 'var(--accent-blue)' },
    { name: 'Buffers', value: memory.buffers, color: 'var(--accent-purple)' },
    { name: 'Free', value: memory.free, color: 'var(--bg-hover)' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total" value={formatBytes(memory.total * 1024 * 1024)} />
        <StatCard label="Used" value={formatBytes(memory.used * 1024 * 1024)} color={color} />
        <StatCard label="Cached" value={formatBytes(memory.cached * 1024 * 1024)} color="var(--accent-blue)" />
        <StatCard label="Swap Used" value={formatBytes(swap.used * 1024 * 1024)} sub={`${swap.usage}% of ${formatBytes(swap.total * 1024 * 1024)}`} />
      </div>
      <div className="flex gap-2">
        {pieData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
            <div className="w-2 h-2 rounded-sm" style={{ background: item.color }} />
            <span className="text-[var(--text-muted)]">{item.name}</span>
            <span className="text-[var(--text-secondary)] font-mono">{formatBytes(item.value * 1024 * 1024)}</span>
          </div>
        ))}
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">History</div>
        <div className="h-40">
          <ResponsiveContainer>
            <AreaChart data={memory.history ?? []}>
              <defs>
                <linearGradient id="memDetailGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(t) => new Date(t).toLocaleTimeString([], { second: '2-digit', minute: '2-digit' })} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [`${(v as number).toFixed(1)}%`, 'Memory']} />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#memDetailGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function NetworkDetail({ metrics }: { metrics: NonNullable<ReturnType<typeof useStore.getState>['metrics']> }) {
  const { network } = metrics;
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {(network.interfaces ?? []).map((iface) => (
          <div key={iface.name} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-semibold text-sm">{iface.name}</span>
              <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                <span className="font-mono">{iface.ip}</span>
                <span className="font-mono text-[var(--text-muted)]">{iface.mac}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="↓ RX Rate" value={`${iface.rxRate.toFixed(1)} MB/s`} color="var(--accent-blue)" />
              <StatCard label="↑ TX Rate" value={`${iface.txRate.toFixed(1)} MB/s`} color="var(--accent-purple)" />
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Traffic History</div>
        <div className="h-40">
          <ResponsiveContainer>
            <AreaChart data={network.history ?? []}>
              <defs>
                <linearGradient id="rxDetailGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="txDetailGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(t) => new Date(t).toLocaleTimeString([], { second: '2-digit', minute: '2-digit' })} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${v.toFixed(0)}`} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} formatter={(v, name) => [`${(v as number).toFixed(1)} MB/s`, name === 'rx' ? '↓ RX' : '↑ TX']} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="rx" name="rx" stroke="var(--accent-blue)" strokeWidth={2} fill="url(#rxDetailGrad)" />
              <Area type="monotone" dataKey="tx" name="tx" stroke="var(--accent-purple)" strokeWidth={2} fill="url(#txDetailGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DockerDetail({ metrics }: { metrics: NonNullable<ReturnType<typeof useStore.getState>['metrics']> }) {
  return (
    <div className="space-y-2">
      {metrics.docker.map((c) => (
        <div key={c.id} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className={`status-dot ${c.status === 'running' ? 'status-online' : c.status === 'paused' ? 'status-warning' : 'status-error'}`} />
              <span className="font-semibold text-sm">{c.name}</span>
              <span className="badge badge-blue text-[9px]">{c.status}</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">{c.id.slice(0, 12)}</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mb-2">{c.image}</div>
          {c.status === 'running' && (
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div><span className="text-[var(--text-muted)]">CPU: </span><span className="text-[var(--text-secondary)]">{c.cpu.toFixed(1)}%</span></div>
              <div><span className="text-[var(--text-muted)]">MEM: </span><span className="text-[var(--text-secondary)]">{c.memory} MB</span></div>
              <div><span className="text-[var(--text-muted)]">Up: </span><span className="text-[var(--text-secondary)]">{c.uptime}</span></div>
            </div>
          )}
          {(c.ports ?? []).length > 0 && (
            <div className="mt-1 flex gap-1 flex-wrap">
              {(c.ports ?? []).map((p) => (
                <span key={p} className="badge badge-purple text-[9px]">{p}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function WidgetDetailModal({ widgetType, onClose }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  const renderContent = () => {
    switch (widgetType) {
      case 'cpu': return <CpuDetail metrics={metrics} />;
      case 'memory': return <MemoryDetail metrics={metrics} />;
      case 'network': return <NetworkDetail metrics={metrics} />;
      case 'docker': return <DockerDetail metrics={metrics} />;
      case 'uptime': return (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Uptime" value={formatUptime(metrics.uptime)} />
          <StatCard label="Hostname" value={metrics.hostname} />
          <StatCard label="OS" value={metrics.os} />
          <StatCard label="Kernel" value={metrics.kernel} />
        </div>
      );
      case 'temperature': return (
        <div className="space-y-3">
          {metrics.temperatures.map((t) => {
            const color = t.temperature >= t.critical * 0.9 ? 'var(--accent-red)' : t.temperature >= t.high * 0.8 ? 'var(--accent-yellow)' : 'var(--accent-green)';
            return (
              <div key={t.sensor} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{t.sensor}</span>
                  <span className="text-xl font-bold font-mono" style={{ color }}>{t.temperature.toFixed(1)}°C</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(t.temperature / t.critical) * 100}%`, background: color }} />
                </div>
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                  <span>0°C</span>
                  <span>High: {t.high}°C</span>
                  <span>Critical: {t.critical}°C</span>
                </div>
              </div>
            );
          })}
        </div>
      );
      default: return (
        <div className="text-[var(--text-muted)] text-center py-8">
          Detailed view for <strong>{widgetType}</strong> coming soon
        </div>
      );
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div
        className="modal w-[700px] max-w-[95vw] animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <TrendingUp size={18} className="text-[var(--accent-blue)]" />
            <h2 className="text-base font-semibold">{TITLES[widgetType] || widgetType}</h2>
            <span className="badge badge-green text-[10px]">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white transition-colors">
              <Settings2 size={14} />
            </button>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-white transition-colors"
              onClick={onClose}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Alerts notice */}
        {(widgetType === 'disk' || widgetType === 'filesystems') && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 rounded-lg bg-[rgba(210,153,34,0.1)] border border-[rgba(210,153,34,0.3)] text-[var(--accent-yellow)] text-xs">
            <AlertCircle size={14} />
            <span>/backup is at 80% — approaching warning threshold</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
