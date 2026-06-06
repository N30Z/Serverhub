import { useStore } from '../../store/useStore';
import { ArrowDown, ArrowUp, Network } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

function fmtBytes(bytes: number): string {
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`;
  if (bytes >= 1e9)  return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6)  return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

export default function NetworkView() {
  const metrics = useStore((s) => s.metrics);
  if (!metrics) return null;

  const { network } = metrics;
  const interfaces = network.interfaces ?? [];
  const history    = network.history ?? [];

  const totalRxRate = interfaces.reduce((s, i) => s + i.rxRate, 0);
  const totalTxRate = interfaces.reduce((s, i) => s + i.txRate, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
        <Network size={14} className="text-[var(--accent-blue)]" />
        <span className="text-xs text-[var(--text-secondary)]">{interfaces.length} interface{interfaces.length !== 1 ? 's' : ''}</span>
        <div className="h-4 w-px bg-[var(--border)]" />
        <ArrowDown size={11} className="text-[var(--accent-blue)]" />
        <span className="text-xs text-[var(--text-muted)]">RX <span className="text-[var(--accent-blue)] font-mono font-semibold">{totalRxRate.toFixed(1)} MB/s</span></span>
        <ArrowUp size={11} className="text-[var(--accent-purple)]" />
        <span className="text-xs text-[var(--text-muted)]">TX <span className="text-[var(--accent-purple)] font-mono font-semibold">{totalTxRate.toFixed(1)} MB/s</span></span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Interface cards */}
        <section>
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Interfaces</div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {interfaces.map((iface) => (
              <div key={iface.name} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(88,166,255,0.1)]">
                      <Network size={14} className="text-[var(--accent-blue)]" />
                    </div>
                    <div>
                      <div className="font-mono font-semibold text-white">{iface.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{iface.mac}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-hover)] px-2 py-1 rounded">{iface.ip}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-hover)]">
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] mb-1">
                      <ArrowDown size={9} className="text-[var(--accent-blue)]" /> RX Rate
                    </div>
                    <div className="font-mono font-bold text-[var(--accent-blue)] text-sm">{iface.rxRate.toFixed(2)} <span className="text-[10px] font-normal text-[var(--text-muted)]">MB/s</span></div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-hover)]">
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] mb-1">
                      <ArrowUp size={9} className="text-[var(--accent-purple)]" /> TX Rate
                    </div>
                    <div className="font-mono font-bold text-[var(--accent-purple)] text-sm">{iface.txRate.toFixed(2)} <span className="text-[10px] font-normal text-[var(--text-muted)]">MB/s</span></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span>Total RX</span>
                    <span className="font-mono text-[var(--text-secondary)]">{fmtBytes(iface.rx)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span>Total TX</span>
                    <span className="font-mono text-[var(--text-secondary)]">{fmtBytes(iface.tx)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* History chart */}
        {history.length > 0 && (
          <section>
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Traffic History</div>
            <div className="card p-4">
              <div className="h-52">
                <ResponsiveContainer>
                  <AreaChart data={history} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rxNetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="txNetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                      tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${v.toFixed(0)} MB/s`} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v, name) => [`${(v as number).toFixed(2)} MB/s`, name === 'rx' ? '↓ RX' : '↑ TX']}
                      labelFormatter={(t) => new Date(t).toLocaleTimeString()}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} formatter={(v) => v === 'rx' ? '↓ Receive' : '↑ Transmit'} />
                    <Area type="monotone" dataKey="rx" name="rx" stroke="var(--accent-blue)" strokeWidth={2} fill="url(#rxNetGrad)" />
                    <Area type="monotone" dataKey="tx" name="tx" stroke="var(--accent-purple)" strokeWidth={2} fill="url(#txNetGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
