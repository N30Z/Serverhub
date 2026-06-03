import { useStore } from '../../../store/useStore';
import { WidgetBase } from './WidgetBase';
import { User, Monitor, Globe } from 'lucide-react';

interface Props { onOpenDetail: () => void; isEditing: boolean; }

export function UsersWidget({ onOpenDetail, isEditing }: Props) {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  return (
    <div className="group h-full" onClick={!isEditing ? onOpenDetail : undefined}>
      <WidgetBase title="Logged In Users" headerRight={
        <span className="badge badge-purple text-[10px]">{metrics.users.length} active</span>
      }>
        <div className="space-y-2">
          {metrics.users.map((u, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-tertiary)]">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: `hsl(${(u.user.charCodeAt(0) * 50) % 360}, 60%, 40%)` }}>
                {u.user[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[var(--text-primary)]">{u.user}</div>
                <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                  <Monitor size={8} />
                  <span>{u.tty}</span>
                  <span>·</span>
                  <Globe size={8} />
                  <span className="truncate">{u.from}</span>
                </div>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] flex-shrink-0">{u.loginTime}</div>
            </div>
          ))}
        </div>
      </WidgetBase>
    </div>
  );
}
