import { useStore } from '../../store/useStore';
import { Play, Square, RotateCcw, Trash2, ExternalLink, Container } from 'lucide-react';

export default function DockerView() {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  const running = metrics.docker.filter((c) => c.status === 'running').length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
        <Container size={14} className="text-[var(--accent-blue)]" />
        <span className="badge badge-green">{running} running</span>
        <span className="badge badge-red">{metrics.docker.filter((c) => c.status === 'stopped' || c.status === 'exited').length} stopped</span>
        <div className="ml-auto">
          <span className="text-xs text-[var(--text-muted)]">{metrics.docker.length} containers total</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', alignContent: 'start' }}>
        {metrics.docker.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`status-dot ${c.status === 'running' ? 'status-online' : c.status === 'paused' ? 'status-warning' : 'status-error'}`} />
                <div>
                  <div className="font-semibold text-white text-sm">{c.name}</div>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono">{c.id.slice(0, 12)}</div>
                </div>
              </div>
              <span className={`badge text-[10px] ${c.status === 'running' ? 'badge-green' : c.status === 'paused' ? 'badge-yellow' : 'badge-red'}`}>
                {c.status}
              </span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mb-3">{c.image}</div>
            {c.status === 'running' && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="text-sm font-bold text-white">{c.cpu.toFixed(1)}%</div>
                  <div className="text-[9px] text-[var(--text-muted)] uppercase">CPU</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="text-sm font-bold text-white">{c.memory}M</div>
                  <div className="text-[9px] text-[var(--text-muted)] uppercase">Memory</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="text-sm font-bold text-white">{c.uptime}</div>
                  <div className="text-[9px] text-[var(--text-muted)] uppercase">Uptime</div>
                </div>
              </div>
            )}
            {c.ports.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-3">
                {c.ports.map((p) => (
                  <span key={p} className="badge badge-blue text-[9px]">{p}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 pt-2 border-t border-[var(--border-subtle)]">
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--accent-green)] hover:bg-[var(--bg-hover)] transition-colors">
                <Play size={11} />Start
              </button>
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--bg-hover)] transition-colors">
                <Square size={11} />Stop
              </button>
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--accent-yellow)] hover:bg-[var(--bg-hover)] transition-colors">
                <RotateCcw size={11} />Restart
              </button>
              <div className="flex-1" />
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)] transition-colors">
                <ExternalLink size={11} />Logs
              </button>
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--bg-hover)] transition-colors">
                <Trash2 size={11} />Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
