import { useStore } from '../../../store/useStore';
import { WidgetBase, formatUptime } from './WidgetBase';
import { Server } from 'lucide-react';

interface Props { onOpenDetail: () => void; isEditing: boolean; }

export function UptimeWidget({ onOpenDetail, isEditing }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  const d = Math.floor(metrics.uptime / 86400);
  const h = Math.floor((metrics.uptime % 86400) / 3600);
  const m = Math.floor((metrics.uptime % 3600) / 60);

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Uptime">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(63, 185, 80, 0.15)' }}>
              <Server size={16} className="text-[var(--accent-green)]" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">{formatUptime(metrics.uptime)}</div>
              <div className="text-[10px] text-[var(--text-muted)]">system uptime</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 mt-1">
            {[['Days', d], ['Hours', h], ['Mins', m]].map(([label, val]) => (
              <div key={label as string} className="text-center p-1.5 rounded-md bg-[var(--bg-tertiary)]">
                <div className="text-sm font-bold text-white">{val}</div>
                <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            <div>OS: <span className="text-[var(--text-secondary)]">{metrics.os}</span></div>
            <div>Kernel: <span className="text-[var(--text-secondary)]">{metrics.kernel}</span></div>
          </div>
        </div>
      </WidgetBase>
    </div>
  );
}
