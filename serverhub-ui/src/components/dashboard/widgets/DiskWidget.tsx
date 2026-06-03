import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useStore } from '../../../store/useStore';
import { WidgetBase } from './WidgetBase';

interface Props { onOpenDetail: () => void; isEditing: boolean; }

export function DiskWidget({ onOpenDetail, isEditing }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;
  const { disk } = metrics;

  const data = disk.map((d) => ({
    name: d.mountpoint,
    read: d.readSpeed,
    write: d.writeSpeed,
  }));

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Disk I/O">
        <div className="flex gap-3 mb-2 text-[11px]">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-[var(--accent-blue)]" />
            <span className="text-[var(--text-muted)]">Read</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm bg-[var(--accent-purple)]" />
            <span className="text-[var(--text-muted)]">Write</span>
          </div>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-primary)' }}
                formatter={(v, name) => [`${(v as number).toFixed(0)} MB/s`, name as string]}
              />
              <Bar dataKey="read" fill="var(--accent-blue)" radius={[2, 2, 0, 0]} maxBarSize={24} />
              <Bar dataKey="write" fill="var(--accent-purple)" radius={[2, 2, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </WidgetBase>
    </div>
  );
}
