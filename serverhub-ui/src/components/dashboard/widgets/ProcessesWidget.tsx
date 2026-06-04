import { useStore } from '../../../store/useStore';
import { WidgetBase } from './WidgetBase';

interface Props { onOpenDetail: () => void; isEditing: boolean; }

export function ProcessesWidget({ onOpenDetail, isEditing }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  const processes = metrics.processes.slice(0, 7);

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Top Processes">
        <div className="h-full overflow-hidden">
          <div className="grid text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider pb-1 border-b border-[var(--border-subtle)] mb-1"
            style={{ gridTemplateColumns: '2rem 1fr 5rem 3.5rem 3.5rem 3rem' }}>
            <span>PID</span><span>Name</span><span>User</span><span className="text-right">CPU%</span><span className="text-right">MEM%</span><span className="text-right">Stat</span>
          </div>
          <div className="space-y-0.5">
            {processes.map((p) => (
              <div key={p.pid} className="grid items-center py-1 rounded hover:bg-[var(--bg-hover)] px-0 text-[11px]"
                style={{ gridTemplateColumns: '2rem 1fr 5rem 3.5rem 3.5rem 3rem' }}>
                <span className="text-[var(--text-muted)] font-mono">{p.pid}</span>
                <span className="font-medium text-[var(--text-primary)] truncate">{p.name}</span>
                <span className="text-[var(--text-secondary)] truncate">{p.user}</span>
                <span className={`text-right font-mono font-semibold ${p.cpu > 15 ? 'text-[var(--accent-yellow)]' : 'text-[var(--text-secondary)]'}`}>{p.cpu.toFixed(1)}</span>
                <span className={`text-right font-mono ${p.memory > 5 ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}`}>{p.memory.toFixed(1)}</span>
                <span className={`text-right text-[10px] font-mono ${p.status === 'R' ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </WidgetBase>
    </div>
  );
}
