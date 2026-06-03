import { useStore } from '../../../store/useStore';
import { WidgetBase } from './WidgetBase';
import { Container } from 'lucide-react';

interface Props { onOpenDetail: () => void; isEditing: boolean; }

export function DockerWidget({ onOpenDetail, isEditing }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  const containers = metrics.docker.slice(0, 6);
  const running = metrics.docker.filter((c) => c.status === 'running').length;

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Docker" headerRight={
        <span className="badge badge-blue text-[10px]">{running} running</span>
      }>
        <div className="space-y-1 overflow-hidden">
          {containers.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-[11px] py-0.5">
              <div className={`status-dot flex-shrink-0 ${
                c.status === 'running' ? 'status-online' :
                c.status === 'paused' ? 'status-warning' :
                'status-error'
              }`} />
              <Container size={10} className="flex-shrink-0 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)] truncate flex-1">{c.name}</span>
              {c.status === 'running' && (
                <span className="text-[10px] text-[var(--text-muted)] font-mono flex-shrink-0">{c.cpu.toFixed(1)}%</span>
              )}
            </div>
          ))}
        </div>
      </WidgetBase>
    </div>
  );
}
