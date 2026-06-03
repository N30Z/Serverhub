import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { useStore } from '../../../store/useStore';
import { WidgetBase } from './WidgetBase';

interface Props { onOpenDetail: () => void; isEditing: boolean; }

export function LoadWidget({ onOpenDetail, isEditing }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;
  const { load, cpu } = metrics;

  const cpuCount = cpu.cores;

  const getColor = (val: number) => {
    const ratio = val / cpuCount;
    if (ratio > 1) return 'var(--accent-red)';
    if (ratio > 0.8) return 'var(--accent-yellow)';
    return 'var(--accent-green)';
  };

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Load Average">
        <div className="flex items-center gap-4 mb-3">
          {[
            { label: '1m', val: load.load1 },
            { label: '5m', val: load.load5 },
            { label: '15m', val: load.load15 },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <div className="text-xl font-bold font-mono" style={{ color: getColor(val) }}>
                {val.toFixed(2)}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
            </div>
          ))}
          <div className="ml-auto text-[11px] text-[var(--text-muted)]">
            {cpuCount} logical CPUs
          </div>
        </div>
        <div className="h-20">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={load.history} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
              <XAxis dataKey="time" hide />
              <YAxis domain={[0, cpuCount]} tick={{ fontSize: 9, fill: 'var(--text-muted)' }} tickCount={3} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-primary)' }}
                formatter={(v) => [(v as number).toFixed(2), 'Load']}
                labelFormatter={() => ''}
              />
              <ReferenceLine y={cpuCount} stroke="var(--accent-red)" strokeDasharray="3 3" strokeWidth={1} opacity={0.5} />
              <Line type="monotone" dataKey="value" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </WidgetBase>
    </div>
  );
}
