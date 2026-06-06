import { useStore } from '../../store/useStore';
import { HardDrive, ArrowDown, ArrowUp } from 'lucide-react';
import { formatBytes, getUsageColor } from '../dashboard/widgets/WidgetBase';

export default function StorageView() {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  const { disk } = metrics;
  const totalSpace = disk.reduce((s, d) => s + d.total, 0);
  const totalUsed  = disk.reduce((s, d) => s + d.used, 0);
  const totalPct   = totalSpace > 0 ? (totalUsed / totalSpace) * 100 : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
        <HardDrive size={14} className="text-[var(--accent-blue)]" />
        <span className="text-xs text-[var(--text-secondary)]">{disk.length} device{disk.length !== 1 ? 's' : ''}</span>
        <div className="h-4 w-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-muted)]">Total: <span className="text-[var(--text-secondary)]">{formatBytes(totalSpace * 1024 * 1024)}</span></span>
        <span className="text-xs text-[var(--text-muted)]">Used: <span style={{ color: getUsageColor(totalPct) }}>{formatBytes(totalUsed * 1024 * 1024)} ({totalPct.toFixed(1)}%)</span></span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Filesystem Usage */}
        <section>
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Filesystem Usage</div>
          <div className="space-y-2">
            {disk.map((d) => {
              const color = getUsageColor(d.usage);
              return (
                <div key={d.mountpoint} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(88,166,255,0.1)]">
                        <HardDrive size={14} className="text-[var(--accent-blue)]" />
                      </div>
                      <div>
                        <div className="font-mono font-semibold text-sm text-white">{d.mountpoint}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{d.device} · {d.fstype}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                      <div className="text-right">
                        <div className="text-[var(--text-muted)]">Used</div>
                        <div className="font-mono font-semibold" style={{ color }}>{formatBytes(d.used * 1024 * 1024)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[var(--text-muted)]">Free</div>
                        <div className="font-mono font-semibold text-[var(--text-secondary)]">{formatBytes(d.free * 1024 * 1024)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[var(--text-muted)]">Total</div>
                        <div className="font-mono font-semibold text-[var(--text-secondary)]">{formatBytes(d.total * 1024 * 1024)}</div>
                      </div>
                      <div className="text-right min-w-[3rem]">
                        <div className="text-lg font-bold font-mono" style={{ color }}>{d.usage.toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${d.usage}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Disk I/O */}
        <section>
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Disk I/O Rates</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {disk.map((d) => (
              <div key={d.device} className="card p-4">
                <div className="text-xs font-mono font-semibold text-white mb-3">{d.mountpoint}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[var(--bg-hover)]">
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mb-1">
                      <ArrowDown size={10} className="text-[var(--accent-blue)]" />
                      Read
                    </div>
                    <div className="font-mono font-bold text-[var(--accent-blue)]">{d.readSpeed.toFixed(1)}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">MB/s</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-hover)]">
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mb-1">
                      <ArrowUp size={10} className="text-[var(--accent-purple)]" />
                      Write
                    </div>
                    <div className="font-mono font-bold text-[var(--accent-purple)]">{d.writeSpeed.toFixed(1)}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">MB/s</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
