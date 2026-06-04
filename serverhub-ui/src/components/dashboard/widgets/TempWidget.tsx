import { useStore } from '../../../store/useStore';
import { WidgetBase } from './WidgetBase';
import { Thermometer } from 'lucide-react';

interface Props { onOpenDetail: () => void; isEditing: boolean; }

export function TempWidget({ onOpenDetail, isEditing }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  const getTempColor = (temp: number, high: number, critical: number) => {
    if (temp >= critical * 0.9) return 'var(--accent-red)';
    if (temp >= high * 0.8) return 'var(--accent-yellow)';
    return 'var(--accent-green)';
  };

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Temperatures">
        <div className="space-y-2 overflow-hidden">
          {metrics.temperatures.map((t) => {
            const color = getTempColor(t.temperature, t.high, t.critical);
            const pct = (t.temperature / t.critical) * 100;
            return (
              <div key={t.sensor} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1">
                    <Thermometer size={10} style={{ color }} />
                    <span className="text-[var(--text-secondary)] truncate max-w-[100px]">{t.sensor}</span>
                  </div>
                  <span className="font-mono font-semibold" style={{ color }}>{t.temperature.toFixed(0)}°C</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </WidgetBase>
    </div>
  );
}
