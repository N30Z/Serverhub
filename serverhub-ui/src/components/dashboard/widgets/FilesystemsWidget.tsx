import { useStore } from '../../../store/useStore';
import { WidgetBase, getUsageColor, formatBytes } from './WidgetBase';
import { HardDrive } from 'lucide-react';

interface Props { onOpenDetail: () => void; isEditing: boolean; }

export function FilesystemsWidget({ onOpenDetail, isEditing }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Filesystems">
        <div className="space-y-2 overflow-hidden">
          {metrics.disk.map((d) => {
            const color = getUsageColor(d.usage);
            return (
              <div key={d.mountpoint}>
                <div className="flex items-center justify-between text-[11px] mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <HardDrive size={10} style={{ color }} className="flex-shrink-0" />
                    <span className="font-mono text-[var(--text-secondary)]">{d.mountpoint}</span>
                    <span className="badge badge-blue text-[9px]">{d.fstype}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <span>{formatBytes(d.used * 1024 * 1024)} / {formatBytes(d.total * 1024 * 1024)}</span>
                    <span className="font-semibold" style={{ color }}>{d.usage}%</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${d.usage}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </WidgetBase>
    </div>
  );
}
