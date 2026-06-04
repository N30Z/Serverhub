import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useStore } from '../../../store/useStore';
import { WidgetBase, GaugeBar, getUsageColor } from './WidgetBase';
import { Donut } from './Donut';

interface Props {
  onOpenDetail: () => void;
  isEditing: boolean;
  variant?: 'chart' | 'number';
}

export function CpuWidget({ onOpenDetail, isEditing, variant = 'chart' }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;
  const { cpu } = metrics;
  const color = getUsageColor(cpu.usage);

  if (variant === 'number') {
    return (
      <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
        <WidgetBase title="CPU Usage">
          <div className="flex items-center gap-3 h-full pb-1">
            <Donut value={cpu.usage} color={color} size={72} strokeWidth={7}
              label={`${cpu.usage.toFixed(0)}%`} sublabel="usage" />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-[var(--text-muted)] truncate">{cpu.model.split(' ').slice(0, 3).join(' ')}</div>
              <div className="text-[11px] mt-1 space-y-0.5">
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Cores</span><span className="font-mono text-[var(--text-secondary)]">{cpu.cores}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Freq</span><span className="font-mono text-[var(--text-secondary)]">{cpu.frequency.toFixed(1)} GHz</span></div>
              </div>
              <GaugeBar value={cpu.usage} color={color} />
            </div>
          </div>
        </WidgetBase>
      </div>
    );
  }

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="CPU Usage">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="metric-value" style={{ color, fontFamily: 'var(--mono)' }}>
              {cpu.usage.toFixed(1)}<span className="text-base font-normal text-[var(--text-secondary)]">%</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate max-w-[120px]">
              {cpu.cores} cores · {cpu.frequency.toFixed(1)} GHz
            </div>
          </div>
        </div>
        <GaugeBar value={cpu.usage} color={color} />
        <div className="mt-2 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cpu.history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-primary)', fontFamily: 'var(--mono)' }}
                formatter={(v) => [`${(v as number).toFixed(1)}%`, 'CPU']}
                labelFormatter={() => ''}
              />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill="url(#cpuGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </WidgetBase>
    </div>
  );
}
