import { useStore } from '../../../store/useStore';
import { WidgetBase } from './WidgetBase';

interface Props { onOpenDetail: () => void; isEditing: boolean; expanded?: boolean; }

function statusDotClass(status: string) {
  if (status === 'active') return 'status-online';
  if (status === 'failed') return 'status-error';
  return 'status-offline';
}

function statusTextClass(status: string) {
  if (status === 'active') return 'text-[var(--accent-green)]';
  if (status === 'failed') return 'text-[var(--accent-red)]';
  return 'text-[var(--text-muted)]';
}

export function ServicesWidget({ onOpenDetail, isEditing, expanded = false }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  const active = metrics.services.filter((s) => s.status === 'active').length;
  const services = expanded ? metrics.services : metrics.services.slice(0, 8);

  if (expanded) {
    return (
      <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
        <WidgetBase title="Services" headerRight={
          <span className="badge badge-green text-[10px]">{active}/{metrics.services.length} active</span>
        }>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 overflow-hidden h-full">
            {services.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between text-[11px] py-1 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`status-dot flex-shrink-0 ${statusDotClass(svc.status)}`} />
                  <span className="text-[var(--text-secondary)] truncate">{svc.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  {svc.since && (
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{svc.since}</span>
                  )}
                  <span className={`text-[10px] font-mono ${statusTextClass(svc.status)}`}>{svc.status}</span>
                </div>
              </div>
            ))}
          </div>
        </WidgetBase>
      </div>
    );
  }

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Services" headerRight={
        <span className="badge badge-green text-[10px]">{active}/{metrics.services.length}</span>
      }>
        <div className="space-y-1 overflow-hidden">
          {services.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between text-[11px] py-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`status-dot flex-shrink-0 ${statusDotClass(svc.status)}`} />
                <span className="text-[var(--text-secondary)] truncate">{svc.name}</span>
              </div>
              <span className={`text-[10px] font-mono ml-2 flex-shrink-0 ${statusTextClass(svc.status)}`}>{svc.status}</span>
            </div>
          ))}
        </div>
      </WidgetBase>
    </div>
  );
}
