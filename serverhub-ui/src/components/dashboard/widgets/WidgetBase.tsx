import { type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';

interface WidgetBaseProps {
  title: string;
  children: ReactNode;
  onOpenDetail?: () => void;
  headerRight?: ReactNode;
  className?: string;
}

export function WidgetBase({ title, children, onOpenDetail, headerRight, className = '' }: WidgetBaseProps) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span className="metric-label">{title}</span>
        <div className="flex items-center gap-2">
          {headerRight}
          {onOpenDetail && (
            <ExternalLink size={11} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
      <div className="flex-1 px-3 pb-3 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function GaugeBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="progress-bar w-full">
      <div
        className="progress-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export function getUsageColor(pct: number) {
  if (pct >= 90) return 'var(--accent-red)';
  if (pct >= 75) return 'var(--accent-yellow)';
  return 'var(--accent-green)';
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
