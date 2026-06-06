import { useState } from 'react';
import { X, TrendingUp, AlertCircle, Settings2, Search } from 'lucide-react';
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

function LoadDetail({ metrics }: { metrics: NonNullable<ReturnType<typeof useStore.getState>['metrics']> }) {
  const { load, cpu } = metrics;
  const utilPct = Math.min((load.load1 / cpu.cores) * 100, 100);
  const color = getUsageColor(utilPct);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="1 min" value={load.load1.toFixed(2)} color={getUsageColor(Math.min((load.load1 / cpu.cores) * 100, 100))} />
        <StatCard label="5 min" value={load.load5.toFixed(2)} color={getUsageColor(Math.min((load.load5 / cpu.cores) * 100, 100))} />
        <StatCard label="15 min" value={load.load15.toFixed(2)} color={getUsageColor(Math.min((load.load15 / cpu.cores) * 100, 100))} />
        <StatCard label="CPU Cores" value={String(cpu.cores)} sub={`${utilPct.toFixed(0)}% utilised`} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Overall Utilisation</span>
          <span className="text-xs font-mono" style={{ color }}>{utilPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${utilPct}%`, background: color }} />
        </div>
        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-0.5">
          <span>0</span>
          <span>Saturated at {cpu.cores}.0</span>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Load History</div>
        <div className="h-40">
          <ResponsiveContainer>
            <LineChart data={load.history ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(t) => new Date(t).toLocaleTimeString([], { second: '2-digit', minute: '2-digit' })} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} formatter={(v) => [(v as number).toFixed(2), 'Load avg']} />
              <Line type="monotone" dataKey="value" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DiskDetail({ metrics }: { metrics: NonNullable<ReturnType<typeof useStore.getState>['metrics']> }) {
  const { disk } = metrics;
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">I/O Rates</div>
        <div className="h-44">
          <ResponsiveContainer>
            <BarChart data={disk.map((d) => ({ name: d.mountpoint, read: d.readSpeed, write: d.writeSpeed }))} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${v}MB/s`} />
              <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} formatter={(v, name) => [`${(v as number).toFixed(1)} MB/s`, name === 'read' ? '↓ Read' : '↑ Write']} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="read" name="read" fill="var(--accent-blue)" radius={[3, 3, 0, 0]} maxBarSize={32} />
              <Bar dataKey="write" name="write" fill="var(--accent-purple)" radius={[3, 3, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="space-y-2">
        {disk.map((d) => {
          const color = getUsageColor(d.usage);
          return (
            <div key={d.mountpoint} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono font-semibold text-sm">{d.mountpoint}</span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-2">{d.device} · {d.fstype}</span>
                </div>
                <span className="text-sm font-bold font-mono" style={{ color }}>{d.usage.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden mb-1">
                <div className="h-full rounded-full" style={{ width: `${d.usage}%`, background: color }} />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>{formatBytes(d.used * 1024 * 1024)} used</span>
                <span>{formatBytes(d.free * 1024 * 1024)} free of {formatBytes(d.total * 1024 * 1024)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilesystemsDetail({ metrics }: { metrics: NonNullable<ReturnType<typeof useStore.getState>['metrics']> }) {
  const { disk } = metrics;
  return (
    <div className="space-y-2">
      <div className="grid text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-3 py-2 border-b border-[var(--border-subtle)]"
        style={{ gridTemplateColumns: '1fr 6rem 7rem 7rem 6rem 8rem' }}>
        <span>Mountpoint</span><span>Type</span><span>Total</span><span>Used</span><span>Usage</span><span className="text-right">Free</span>
      </div>
      {disk.map((d) => {
        const color = getUsageColor(d.usage);
        return (
          <div key={d.mountpoint} className="space-y-1 px-1">
            <div className="grid items-center px-2 py-2 rounded-lg hover:bg-[var(--bg-hover)] text-sm"
              style={{ gridTemplateColumns: '1fr 6rem 7rem 7rem 6rem 8rem' }}>
              <div>
                <div className="font-mono font-medium text-white text-xs">{d.mountpoint}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{d.device}</div>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{d.fstype}</span>
              <span className="text-xs font-mono text-[var(--text-secondary)]">{formatBytes(d.total * 1024 * 1024)}</span>
              <span className="text-xs font-mono" style={{ color }}>{formatBytes(d.used * 1024 * 1024)}</span>
              <div>
                <div className="text-xs font-mono mb-0.5" style={{ color }}>{d.usage.toFixed(1)}%</div>
                <div className="h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden w-full">
                  <div className="h-full rounded-full" style={{ width: `${d.usage}%`, background: color }} />
                </div>
              </div>
              <span className="text-xs font-mono text-right text-[var(--text-secondary)]">{formatBytes(d.free * 1024 * 1024)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProcessesDetail({ metrics }: { metrics: NonNullable<ReturnType<typeof useStore.getState>['metrics']> }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'pid'>('cpu');

  const procs = metrics.processes
    .filter((p) => !search || p.name.includes(search) || p.user.includes(search) || String(p.pid).includes(search))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input className="input pl-8 py-1.5 text-xs w-full" placeholder="Filter by name, user or PID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          Sort:
          {(['cpu', 'memory', 'pid'] as const).map((s) => (
            <button key={s} className={`px-2 py-1 rounded text-xs ${sortBy === s ? 'bg-[var(--bg-card)] text-white' : 'hover:text-white'}`} onClick={() => setSortBy(s)}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="grid text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1.5 border-b border-[var(--border-subtle)]"
          style={{ gridTemplateColumns: '3.5rem 1fr 6rem 4.5rem 4.5rem 3rem 6rem' }}>
          <span>PID</span><span>Name</span><span>User</span>
          <span className="text-right">CPU%</span><span className="text-right">MEM%</span>
          <span className="text-center">Stat</span><span className="text-right">Started</span>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {procs.map((p) => (
            <div key={p.pid} className="grid items-center px-2 py-2 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-sm"
              style={{ gridTemplateColumns: '3.5rem 1fr 6rem 4.5rem 4.5rem 3rem 6rem' }}>
              <span className="font-mono text-xs text-[var(--text-muted)]">{p.pid}</span>
              <span className="font-medium text-white text-xs truncate">{p.name}</span>
              <span className="text-[var(--text-secondary)] text-xs">{p.user}</span>
              <span className={`text-right font-mono text-xs ${p.cpu > 15 ? 'text-[var(--accent-yellow)]' : 'text-[var(--text-secondary)]'}`}>{p.cpu.toFixed(1)}</span>
              <span className={`text-right font-mono text-xs ${p.memory > 5 ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}>{p.memory.toFixed(1)}</span>
              <span className={`text-center font-mono text-xs ${p.status === 'R' ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'}`}>{p.status}</span>
              <span className="text-right text-xs text-[var(--text-muted)]">{p.started}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesDetail({ metrics }: { metrics: NonNullable<ReturnType<typeof useStore.getState>['metrics']> }) {
  const [search, setSearch] = useState('');
  const svcs = metrics.services.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()));
  const active = metrics.services.filter((s) => s.status === 'active').length;
  const failed = metrics.services.filter((s) => s.status === 'failed').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="badge badge-green">{active} active</span>
        <span className="badge badge-red">{failed} failed</span>
        <span className="badge text-[var(--text-muted)] border-[var(--border)]">{metrics.services.length - active - failed} inactive</span>
        <div className="relative ml-auto">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input className="input pl-8 py-1.5 text-xs w-48" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div>
        <div className="grid text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-2 py-1.5 border-b border-[var(--border-subtle)]"
          style={{ gridTemplateColumns: '1fr 7rem 5rem 8rem' }}>
          <span>Service</span><span>Status</span><span>Enabled</span><span>Since</span>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {svcs.map((svc) => (
            <div key={svc.name} className="grid items-center px-2 py-2.5 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]"
              style={{ gridTemplateColumns: '1fr 7rem 5rem 8rem' }}>
              <div>
                <div className="text-xs font-medium text-white">{svc.name}</div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">{svc.description}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`status-dot ${svc.status === 'active' ? 'status-online' : svc.status === 'failed' ? 'status-error' : 'status-offline'}`} />
                <span className={`text-xs ${svc.status === 'active' ? 'text-[var(--accent-green)]' : svc.status === 'failed' ? 'text-[var(--accent-red)]' : 'text-[var(--text-muted)]'}`}>{svc.status}</span>
              </div>
              <span className={`text-xs ${svc.enabled ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'}`}>{svc.enabled ? 'Yes' : 'No'}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{svc.since}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersDetail({ metrics }: { metrics: NonNullable<ReturnType<typeof useStore.getState>['metrics']> }) {
  const { users } = metrics;
  if (users.length === 0) {
    return <div className="text-center py-8 text-[var(--text-muted)] text-sm">No users currently logged in</div>;
  }
  return (
    <div className="space-y-2">
      <div className="grid text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-3 py-2 border-b border-[var(--border-subtle)]"
        style={{ gridTemplateColumns: '8rem 7rem 1fr 10rem' }}>
        <span>User</span><span>Terminal</span><span>From</span><span className="text-right">Login Time</span>
      </div>
      {users.map((u, i) => (
        <div key={i} className="grid items-center px-3 py-3 rounded-lg hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)]"
          style={{ gridTemplateColumns: '8rem 7rem 1fr 10rem' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase"
              style={{ background: 'rgba(88,166,255,0.15)', color: 'var(--accent-blue)' }}>
              {u.user[0]}
            </div>
            <span className="text-sm font-medium text-white">{u.user}</span>
          </div>
          <span className="font-mono text-xs text-[var(--text-muted)]">{u.tty}</span>
          <span className="text-xs text-[var(--text-secondary)]">{u.from || 'local'}</span>
          <span className="text-xs text-[var(--text-muted)] text-right">{u.loginTime}</span>
        </div>
      ))}
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
      case 'cpu':         return <CpuDetail metrics={metrics} />;
      case 'memory':      return <MemoryDetail metrics={metrics} />;
      case 'network':     return <NetworkDetail metrics={metrics} />;
      case 'docker':      return <DockerDetail metrics={metrics} />;
      case 'load':        return <LoadDetail metrics={metrics} />;
      case 'disk':        return <DiskDetail metrics={metrics} />;
      case 'filesystems': return <FilesystemsDetail metrics={metrics} />;
      case 'processes':   return <ProcessesDetail metrics={metrics} />;
      case 'services':    return <ServicesDetail metrics={metrics} />;
      case 'users':       return <UsersDetail metrics={metrics} />;
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
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[rgba(88,166,255,0.1)]">
            <TrendingUp size={22} className="text-[var(--accent-blue)] opacity-60" />
          </div>
          <div className="text-[var(--text-muted)] text-sm text-center">
            <div className="font-medium text-[var(--text-secondary)] mb-1">Detailed view coming soon</div>
            <div className="text-xs">{TITLES[widgetType] || widgetType} analytics will appear here</div>
          </div>
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

        {(widgetType === 'disk' || widgetType === 'filesystems') && metrics.disk.some((d) => d.usage > 75) && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3 rounded-lg bg-[rgba(210,153,34,0.1)] border border-[rgba(210,153,34,0.3)] text-[var(--accent-yellow)] text-xs">
            <AlertCircle size={14} />
            <span>{metrics.disk.filter((d) => d.usage > 75).map((d) => d.mountpoint).join(', ')} {metrics.disk.filter((d) => d.usage > 75).length > 1 ? 'are' : 'is'} above 75% — consider freeing space</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
