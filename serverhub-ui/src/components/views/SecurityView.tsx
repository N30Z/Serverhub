import { Shield, Lock, Key, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

const PLANNED = [
  {
    icon: <Shield size={18} />,
    title: 'Firewall Manager',
    desc: 'View and manage iptables / nftables rules with live hit counters and traffic statistics.',
    color: 'var(--accent-green)',
    eta: 'Q3 2025',
  },
  {
    icon: <Lock size={18} />,
    title: 'Fail2ban Monitor',
    desc: 'Track banned IPs, jail status, and intrusion attempts across all services.',
    color: 'var(--accent-blue)',
    eta: 'Q3 2025',
  },
  {
    icon: <Key size={18} />,
    title: 'SSH Key Manager',
    desc: 'Manage authorized_keys for all users, rotate keys, and audit access.',
    color: 'var(--accent-purple)',
    eta: 'Q4 2025',
  },
  {
    icon: <Eye size={18} />,
    title: 'Audit Log',
    desc: 'Chronological audit trail of all actions taken through the ServerHub dashboard.',
    color: 'var(--accent-cyan)',
    eta: 'Q4 2025',
  },
  {
    icon: <AlertTriangle size={18} />,
    title: 'Vulnerability Scanner',
    desc: 'Scan installed packages against known CVEs and suggest remediation steps.',
    color: 'var(--accent-yellow)',
    eta: 'Q1 2026',
  },
  {
    icon: <CheckCircle size={18} />,
    title: 'CIS Benchmark',
    desc: 'Automated compliance checks against CIS Linux Benchmark hardening guidelines.',
    color: 'var(--accent-orange)',
    eta: 'Q1 2026',
  },
];

export default function SecurityView() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
        <Shield size={14} className="text-[var(--accent-green)]" />
        <span className="text-xs text-[var(--text-secondary)]">Security Center</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ml-2"
          style={{ background: 'rgba(88,166,255,0.12)', color: 'var(--accent-blue)', border: '1px solid rgba(88,166,255,0.25)' }}>
          Coming Soon
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(63,185,80,0.12)', color: 'var(--accent-green)' }}>
              <Shield size={28} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Security Center</h2>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              A unified security management panel is in development. The features below are planned for upcoming releases.
            </p>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {PLANNED.map((f) => (
              <div key={f.title} className="card p-4 opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `color-mix(in srgb, ${f.color} 12%, transparent)`, color: f.color }}>
                    {f.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-semibold text-white">{f.title}</div>
                      <span className="text-[9px] font-mono text-[var(--text-muted)] ml-auto">{f.eta}</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
