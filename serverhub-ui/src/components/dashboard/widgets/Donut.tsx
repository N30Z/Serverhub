interface DonutProps {
  value: number;
  max?: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export function Donut({
  value, max = 100, color, size = 80, strokeWidth = 8,
  label, sublabel,
}: DonutProps) {
  const pct = Math.min(1, value / max);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--bg-hover)"
          strokeWidth={strokeWidth}
        />
        {/* fill */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      {(label || sublabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {label && (
            <div className="font-bold leading-none" style={{
              fontSize: size * 0.22,
              color,
              fontFamily: 'var(--mono)',
            }}>
              {label}
            </div>
          )}
          {sublabel && (
            <div className="leading-none mt-0.5" style={{
              fontSize: size * 0.12,
              color: 'var(--text-muted)',
            }}>
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
