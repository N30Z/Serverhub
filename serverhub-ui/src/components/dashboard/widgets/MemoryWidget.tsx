import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useStore } from '../../../store/useStore';
import { WidgetBase, GaugeBar, getUsageColor, formatBytes } from './WidgetBase';
import { Donut } from './Donut';

interface Props {
  onOpenDetail: () => void;
  isEditing: boolean;
  variant?: 'chart' | 'number';
}

export function MemoryWidget({ onOpenDetail, isEditing, variant = 'chart' }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;
  const { memory, swap } = metrics;
  const color = getUsageColor(memory.usage);

  if (variant === 'number') {
    return (
      <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
        <WidgetBase title="Memory">
          <div className="flex items-center gap-3 h-full pb-1">
            <Donut value={memory.usage} color={color} size={72} strokeWidth={7}
              label={`${memory.usage.toFixed(0)}%`} sublabel="used" />
            <div className="flex-1 min-w-0 space-y-1 text-[11px]">
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Used</span><span className="font-mono" style={{ color }}>{formatBytes(memory.used * 1024 * 1024)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Cache</span><span className="font-mono text-[var(--text-secondary)]">{formatBytes(memory.cached * 1024 * 1024)}</span></div>
              <div className="flex justify-between"><span className="text-[var(--text-muted)]">Swap</span><span className="font-mono text-[var(--text-secondary)]">{formatBytes(swap.used * 1024 * 1024)}</span></div>
              <GaugeBar value={memory.usage} color={color} />
            </div>
          </div>
        </WidgetBase>
      </div>
    );
  }

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Memory">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="metric-value" style={{ color, fontFamily: 'var(--mono)' }}>
              {memory.usage.toFixed(1)}<span className="text-base font-normal text-[var(--text-secondary)]">%</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {formatBytes(memory.used * 1024 * 1024)} / {formatBytes(memory.total * 1024 * 1024)}
            </div>
          </div>
          <div className="text-right text-[11px]">
            <div className="text-[var(--text-muted)]">Swap</div>
            <div className="text-[var(--text-secondary)] font-mono">{formatBytes(swap.used * 1024 * 1024)}</div>
          </div>
        </div>
        <GaugeBar value={memory.usage} color={color} />
        <div className="mt-1.5 flex gap-3 text-[10px] text-[var(--text-muted)]">
          <span>Cache <span className="text-[var(--text-secondary)] font-mono">{formatBytes(memory.cached * 1024 * 1024)}</span></span>
          <span>Buf <span className="text-[var(--text-secondary)] font-mono">{formatBytes(memory.buffers * 1024 * 1024)}</span></span>
        </div>
        <div className="mt-1.5 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={memory.history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}
                formatter={(v) => [`${(v as number).toFixed(1)}%`, 'Memory']}
                labelFormatter={() => ''}
              />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill="url(#memGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </WidgetBase>
    </div>
  );
}
