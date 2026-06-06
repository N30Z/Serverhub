import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Play, Square, RotateCcw, Trash2, ExternalLink, Container, Loader2, X } from 'lucide-react';
import { apiRequest, apiRequestRaw } from '../../api/client';
import type { DockerContainer } from '../../types';

async function dockerAction(id: string, action: 'start' | 'stop' | 'restart' | 'remove') {
  await apiRequest(`/api/docker/${encodeURIComponent(id)}/action`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

function LogsModal({ container, onClose }: { container: DockerContainer; onClose: () => void }) {
  const [logs, setLogs] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useState(() => {
    apiRequestRaw(`/api/docker/${encodeURIComponent(container.id)}/logs?tail=200`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.text();
      })
      .then((text) => { setLogs(text); setLoading(false); })
      .catch((e) => { setErr((e as Error).message); setLoading(false); });
  });

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal w-[700px] max-w-[95vw] animate-slide-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold">{container.name}</h2>
            <div className="text-xs text-[var(--text-muted)] font-mono">{container.id.slice(0, 12)}</div>
          </div>
          <button className="text-[var(--text-muted)] hover:text-white" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-4 overflow-y-auto font-mono text-xs terminal-container bg-[#0d1117] text-[#e6edf3]" style={{ height: '60vh', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {loading && <span className="text-[var(--text-muted)]">Loading logs…</span>}
          {err && <span className="text-[var(--accent-red)]">{err}</span>}
          {logs}
        </div>
      </div>
    </div>
  );
}

export default function DockerView() {
  const metrics = useStore((s) => s.metrics);
  const [pending, setPending] = useState<Record<string, string>>({});
  const [logsFor, setLogsFor] = useState<DockerContainer | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!metrics) return null;

  const running = metrics.docker.filter((c) => c.status === 'running').length;

  const doAction = async (c: DockerContainer, action: 'start' | 'stop' | 'restart' | 'remove') => {
    setPending((p) => ({ ...p, [c.id]: action }));
    setError(null);
    try {
      await dockerAction(c.id, action);
    } catch (e) {
      setError(`${action} ${c.name}: ${(e as Error).message}`);
    } finally {
      setPending((p) => { const n = { ...p }; delete n[c.id]; return n; });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
        <Container size={14} className="text-[var(--accent-blue)]" />
        <span className="badge badge-green">{running} running</span>
        <span className="badge badge-red">{metrics.docker.filter((c) => c.status === 'stopped' || c.status === 'exited').length} stopped</span>
        <div className="ml-auto flex items-center gap-3">
          {error && <span className="text-xs text-[var(--accent-red)] truncate max-w-sm" title={error}>{error}</span>}
          <span className="text-xs text-[var(--text-muted)]">{metrics.docker.length} containers total</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', alignContent: 'start' }}>
        {metrics.docker.map((c) => {
          const busy = pending[c.id];
          return (
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
                {busy ? (
                  <Loader2 size={13} className="animate-spin text-[var(--text-muted)] mr-1" />
                ) : (
                  <>
                    <button
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--accent-green)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40"
                      disabled={c.status === 'running'}
                      onClick={() => doAction(c, 'start')}
                    >
                      <Play size={11} />Start
                    </button>
                    <button
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-40"
                      disabled={c.status !== 'running'}
                      onClick={() => doAction(c, 'stop')}
                    >
                      <Square size={11} />Stop
                    </button>
                    <button
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--accent-yellow)] hover:bg-[var(--bg-hover)] transition-colors"
                      onClick={() => doAction(c, 'restart')}
                    >
                      <RotateCcw size={11} />Restart
                    </button>
                  </>
                )}
                <div className="flex-1" />
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-hover)] transition-colors"
                  onClick={() => setLogsFor(c)}
                >
                  <ExternalLink size={11} />Logs
                </button>
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--accent-red)] hover:bg-[var(--bg-hover)] transition-colors"
                  onClick={() => doAction(c, 'remove')}
                >
                  <Trash2 size={11} />Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {logsFor && <LogsModal container={logsFor} onClose={() => setLogsFor(null)} />}
    </div>
  );
}
