import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { useStore } from '../../../store/useStore';
import { WidgetBase, formatBytes } from './WidgetBase';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface Props {
  onOpenDetail: () => void;
  isEditing: boolean;
  variant?: 'chart' | 'number';
}

export function NetworkWidget({ onOpenDetail, isEditing, variant = 'chart' }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;
  const { network } = metrics;
  const primary = network.interfaces[0];

  const rxRate = primary?.rxRate ?? 0;
  const txRate = primary?.txRate ?? 0;

  if (variant === 'number') {
    const rxTotal = formatBytes(primary?.rx ?? 0);
    const txTotal = formatBytes(primary?.tx ?? 0);
    return (
      <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
        <WidgetBase title="Network">
          <div className="flex flex-col justify-between h-full pb-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ArrowDown size={13} className="text-[var(--accent-blue)]" />
                  <span className="text-[10px] text-[var(--text-muted)]">RX</span>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono" style={{ fontSize: 20, color: 'var(--accent-blue)', fontFamily: 'var(--mono)' }}>{rxRate.toFixed(1)}</span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-1">MB/s</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ArrowUp size={13} className="text-[var(--accent-purple)]" />
                  <span className="text-[10px] text-[var(--text-muted)]">TX</span>
                </div>
                <div className="text-right">
                  <span className="font-bold font-mono" style={{ fontSize: 20, color: 'var(--accent-purple)', fontFamily: 'var(--mono)' }}>{txRate.toFixed(1)}</span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-1">MB/s</span>
                </div>
              </div>
            </div>
            <div className="mt-2 text-[10px] space-y-0.5">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>{primary?.name} · {primary?.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total ↓</span><span className="font-mono text-[var(--text-secondary)]">{rxTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Total ↑</span><span className="font-mono text-[var(--text-secondary)]">{txTotal}</span>
              </div>
            </div>
          </div>
        </WidgetBase>
      </div>
    );
  }

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Network">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <ArrowDown size={12} className="text-[var(--accent-blue)]" />
              <span className="metric-value text-lg text-[var(--accent-blue)]">{rxRate.toFixed(1)}</span>
              <span className="text-[10px] text-[var(--text-muted)]">MB/s</span>
            </div>
            <div className="flex items-center gap-1">
              <ArrowUp size={12} className="text-[var(--accent-purple)]" />
              <span className="metric-value text-lg text-[var(--accent-purple)]">{txRate.toFixed(1)}</span>
              <span className="text-[10px] text-[var(--text-muted)]">MB/s</span>
            </div>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">{primary?.name}</div>
        </div>
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={network.history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-primary)' }}
                formatter={(v, name) => [`${(v as number).toFixed(1)} MB/s`, name === 'rx' ? '↓ RX' : '↑ TX']}
                labelFormatter={() => ''}
              />
              <Area type="monotone" dataKey="rx" stroke="var(--accent-blue)" strokeWidth={1.5} fill="url(#rxGrad)" dot={false} />
              <Area type="monotone" dataKey="tx" stroke="var(--accent-purple)" strokeWidth={1.5} fill="url(#txGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-1 text-[10px] text-[var(--text-muted)]">{primary?.ip}</div>
      </WidgetBase>
    </div>
  );
}
