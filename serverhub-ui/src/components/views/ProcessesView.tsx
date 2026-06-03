import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Search, RefreshCw, Signal } from 'lucide-react';

export default function ProcessesView() {
  const metrics = useStore((s) => s.metrics);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'cpu' | 'memory' | 'pid'>('cpu');

  if (!metrics) return null;

  const processes = metrics.processes
    .filter((p) => !search || p.name.includes(search) || p.user.includes(search) || String(p.pid).includes(search))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
        <Signal size={14} className="text-[var(--accent-blue)]" />
        <span className="text-xs text-[var(--text-secondary)]">{metrics.processes.length} processes</span>
        <div className="relative ml-2">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input className="input pl-8 py-1 text-xs w-48" placeholder="Filter..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-[var(--text-muted)]">
          Sort by:
          {(['cpu', 'memory', 'pid'] as const).map((s) => (
            <button key={s} className={`px-2 py-1 rounded ${sortBy === s ? 'bg-[var(--bg-card)] text-white' : 'hover:text-white'}`} onClick={() => setSortBy(s)}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-4 py-2 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-primary)]"
          style={{ gridTemplateColumns: '4rem 1fr 7rem 5rem 5rem 4rem 6rem' }}>
          <span>PID</span><span>Name</span><span>User</span>
          <span className="text-right">CPU%</span><span className="text-right">MEM%</span>
          <span className="text-right">Stat</span><span className="text-right">Started</span>
        </div>
        {processes.map((p) => (
          <div key={p.pid} className="grid items-center px-4 py-2.5 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-sm"
            style={{ gridTemplateColumns: '4rem 1fr 7rem 5rem 5rem 4rem 6rem' }}>
            <span className="font-mono text-xs text-[var(--text-muted)]">{p.pid}</span>
            <span className="font-medium text-white">{p.name}</span>
            <span className="text-[var(--text-secondary)] text-xs">{p.user}</span>
            <span className={`text-right font-mono text-xs ${p.cpu > 15 ? 'text-[var(--accent-yellow)]' : 'text-[var(--text-secondary)]'}`}>{p.cpu.toFixed(1)}</span>
            <span className={`text-right font-mono text-xs ${p.memory > 5 ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}>{p.memory.toFixed(1)}</span>
            <span className={`text-right font-mono text-xs ${p.status === 'R' ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'}`}>{p.status}</span>
            <span className="text-right text-xs text-[var(--text-muted)]">{p.started}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
