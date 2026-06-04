import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Play, Square, RotateCcw, Search } from 'lucide-react';

export default function ServicesView() {
  const metrics = useStore((s) => s.metrics);
  const [search, setSearch] = useState('');

  if (!metrics) return null;

  const services = metrics.services.filter(
    (s) => !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const active = metrics.services.filter((s) => s.status === 'active').length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
        <span className="badge badge-green">{active} active</span>
        <span className="badge badge-red">{metrics.services.filter((s) => s.status === 'failed').length} failed</span>
        <div className="relative ml-2">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input className="input pl-8 py-1 text-xs w-48" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="grid text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-4 py-2 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-primary)]"
          style={{ gridTemplateColumns: '1fr 8rem 6rem 8rem 8rem' }}>
          <span>Service</span><span>Status</span><span>Enabled</span><span>Since</span><span className="text-right">Actions</span>
        </div>
        {services.map((svc) => (
          <div key={svc.name} className="grid items-center px-4 py-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-sm"
            style={{ gridTemplateColumns: '1fr 8rem 6rem 8rem 8rem' }}>
            <div>
              <div className="font-medium text-white">{svc.name}</div>
              <div className="text-xs text-[var(--text-muted)] truncate">{svc.description}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`status-dot ${svc.status === 'active' ? 'status-online' : svc.status === 'failed' ? 'status-error' : 'status-offline'}`} />
              <span className={`text-xs ${svc.status === 'active' ? 'text-[var(--accent-green)]' : svc.status === 'failed' ? 'text-[var(--accent-red)]' : 'text-[var(--text-muted)]'}`}>
                {svc.status}
              </span>
            </div>
            <span className={`text-xs ${svc.enabled ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'}`}>{svc.enabled ? 'Enabled' : 'Disabled'}</span>
            <span className="text-xs text-[var(--text-muted)]">{svc.since}</span>
            <div className="flex items-center gap-1 justify-end">
              <button className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--accent-green)] transition-colors" title="Start">
                <Play size={12} />
              </button>
              <button className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--accent-red)] transition-colors" title="Stop">
                <Square size={12} />
              </button>
              <button className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--accent-yellow)] transition-colors" title="Restart">
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
