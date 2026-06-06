import { useState } from 'react';
import { Terminal, Search, Filter } from 'lucide-react';

const LEVELS = ['info', 'warn', 'error', 'debug'] as const;
type Level = typeof LEVELS[number];

const LEVEL_STYLE: Record<Level, { color: string; badge: string }> = {
  error: { color: 'var(--accent-red)',    badge: 'bg-[rgba(248,81,73,0.15)] text-[var(--accent-red)]' },
  warn:  { color: 'var(--accent-yellow)', badge: 'bg-[rgba(210,153,34,0.15)] text-[var(--accent-yellow)]' },
  info:  { color: 'var(--accent-blue)',   badge: 'bg-[rgba(88,166,255,0.15)] text-[var(--accent-blue)]' },
  debug: { color: 'var(--text-muted)',    badge: 'bg-[var(--bg-hover)] text-[var(--text-muted)]' },
};

const SAMPLE_LOGS = [
  { time: '18:42:01', level: 'info'  as Level, unit: 'sshd',           msg: 'Accepted publickey for admin from 192.168.1.5 port 52841 ssh2' },
  { time: '18:41:57', level: 'warn'  as Level, unit: 'kernel',         msg: 'EXT4-fs warning: ext4_dir_index_dirty: dirblock (2) is not dirty' },
  { time: '18:41:45', level: 'info'  as Level, unit: 'nginx',          msg: '192.168.1.1 - - [GET /api/metrics HTTP/1.1] 200 1482 "-" "Go-http-client/1.1"' },
  { time: '18:41:33', level: 'error' as Level, unit: 'postgresql',     msg: 'FATAL: could not connect to the primary server: connection to server failed' },
  { time: '18:41:20', level: 'info'  as Level, unit: 'systemd',        msg: 'Started serverhub-agent.service - ServerHub Agent.' },
  { time: '18:41:18', level: 'debug' as Level, unit: 'NetworkManager', msg: 'device (eth0): carrier lost' },
  { time: '18:40:55', level: 'warn'  as Level, unit: 'kernel',         msg: 'TCP: Possible SYN flooding on port 443. Sending cookies.' },
  { time: '18:40:44', level: 'info'  as Level, unit: 'cron',           msg: '(root) CMD (/usr/bin/certbot renew --quiet)' },
  { time: '18:40:30', level: 'error' as Level, unit: 'docker',         msg: 'time="2025-06-06T18:40:30Z" level=error msg="containerd: deleting container" error="context deadline exceeded"' },
  { time: '18:40:12', level: 'info'  as Level, unit: 'sshd',           msg: 'Server listening on 0.0.0.0 port 22.' },
  { time: '18:39:58', level: 'debug' as Level, unit: 'systemd-resolved', msg: 'Cache: 142/512 positive, 0/0 negative, 12/0 expunged' },
  { time: '18:39:44', level: 'info'  as Level, unit: 'postfix',        msg: 'starting the Postfix mail system' },
];

export default function LogsView() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<Level | 'all'>('all');

  const filtered = SAMPLE_LOGS.filter((l) => {
    if (levelFilter !== 'all' && l.level !== levelFilter) return false;
    if (search && !l.msg.toLowerCase().includes(search.toLowerCase()) && !l.unit.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0 flex-wrap">
        <Terminal size={14} className="text-[var(--accent-blue)]" />
        <span className="text-xs text-[var(--text-secondary)]">System Logs</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(88,166,255,0.12)', color: 'var(--accent-blue)', border: '1px solid rgba(88,166,255,0.25)' }}>
          Preview
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <Filter size={11} className="text-[var(--text-muted)]" />
          {(['all', ...LEVELS] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                levelFilter === l
                  ? 'bg-[var(--bg-card)] text-white'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="input pl-8 py-1 text-xs w-44"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Notice banner */}
      <div className="px-4 py-2 bg-[rgba(88,166,255,0.05)] border-b border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)] flex items-center gap-2 flex-shrink-0">
        <Terminal size={10} className="text-[var(--accent-blue)]" />
        Real-time log streaming is coming soon. The entries below are sample data.
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto font-mono text-xs bg-[var(--bg-primary)]">
        {filtered.map((log, i) => {
          const style = LEVEL_STYLE[log.level];
          return (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-2 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] group"
            >
              <span className="text-[var(--text-muted)] flex-shrink-0 mt-px">{log.time}</span>
              <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${style.badge}`}>
                {log.level}
              </span>
              <span className="text-[var(--accent-blue)] flex-shrink-0 min-w-[120px]">{log.unit}</span>
              <span className="text-[var(--text-secondary)] break-all leading-relaxed">{log.msg}</span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)]">No log entries match your filter</div>
        )}
      </div>
    </div>
  );
}
