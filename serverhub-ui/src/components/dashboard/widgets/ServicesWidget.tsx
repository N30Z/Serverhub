import { useStore } from '../../../store/useStore';
import { WidgetBase } from './WidgetBase';

interface Props { onOpenDetail: () => void; isEditing: boolean; }

export function ServicesWidget({ onOpenDetail, isEditing }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  const services = metrics.services.slice(0, 8);
  const active = metrics.services.filter((s) => s.status === 'active').length;

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Services" headerRight={
        <span className="badge badge-green text-[10px]">{active}/{metrics.services.length}</span>
      }>
        <div className="space-y-1 overflow-hidden">
          {services.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between text-[11px] py-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`status-dot flex-shrink-0 ${
                  svc.status === 'active' ? 'status-online' :
                  svc.status === 'failed' ? 'status-error' :
                  'status-offline'
                }`} />
                <span className="text-[var(--text-secondary)] truncate">{svc.name}</span>
              </div>
              <span className={`text-[10px] font-mono ml-2 flex-shrink-0 ${
                svc.status === 'active' ? 'text-[var(--accent-green)]' :
                svc.status === 'failed' ? 'text-[var(--accent-red)]' :
                'text-[var(--text-muted)]'
              }`}>{svc.status}</span>
            </div>
          ))}
        </div>
      </WidgetBase>
    </div>
  );
}
