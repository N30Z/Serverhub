import { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, AlertOctagon, Info, Settings2, Mail, Smartphone, Filter } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { apiRequest } from '../../api/client';
import type { Alert, AlertRule, AlertType } from '../../types';
import { clsx } from 'clsx';

const TYPE_LABELS: Record<AlertType, string> = {
  cpu: 'CPU', memory: 'Memory', disk: 'Disk', service: 'Service', docker: 'Docker', host: 'Host',
};

const TYPE_ICONS: Record<AlertType, string> = {
  cpu: '🖥️', memory: '🧮', disk: '💾', service: '⚙️', docker: '🐳', host: '🌐',
};

function SeverityIcon({ severity }: { severity: Alert['severity'] }) {
  if (severity === 'critical') return <AlertOctagon size={14} className="text-[var(--accent-red)]" />;
  if (severity === 'warning') return <AlertTriangle size={14} className="text-[var(--accent-yellow)]" />;
  return <Info size={14} className="text-[var(--accent-blue)]" />;
}

function AlertCard({ alert, onResolve }: { alert: Alert; onResolve: () => void }) {
  const age = Math.round((Date.now() - new Date(alert.timestamp).getTime()) / 60000);
  const ageText = age < 60 ? `${age}m ago` : age < 1440 ? `${Math.floor(age / 60)}h ago` : `${Math.floor(age / 1440)}d ago`;

  return (
    <div className={clsx(
      'flex items-start gap-3 p-4 rounded-xl border transition-all',
      alert.resolved
        ? 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] opacity-60'
        : alert.severity === 'critical'
        ? 'border-[rgba(248,81,73,0.3)] bg-[rgba(248,81,73,0.05)] glow-red'
        : alert.severity === 'warning'
        ? 'border-[rgba(210,153,34,0.3)] bg-[rgba(210,153,34,0.05)]'
        : 'border-[var(--border)] bg-[var(--bg-card)]'
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {alert.resolved
          ? <CheckCircle size={16} className="text-[var(--accent-green)]" />
          : <SeverityIcon severity={alert.severity} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white">{alert.title}</span>
          <span className="badge badge-blue text-[9px]">{TYPE_LABELS[alert.type]}</span>
          {!alert.resolved && (
            <span className={clsx('badge text-[9px]',
              alert.severity === 'critical' ? 'badge-red' :
              alert.severity === 'warning' ? 'badge-yellow' : 'badge-blue'
            )}>{alert.severity}</span>
          )}
          {alert.resolved && <span className="badge badge-green text-[9px]">resolved</span>}
        </div>
        <div className="text-xs text-[var(--text-secondary)]">{alert.message}</div>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-muted)]">
          <span>{new Date(alert.timestamp).toLocaleString()}</span>
          <span>·</span>
          <span>{ageText}</span>
          <span>·</span>
          <span>{alert.server}</span>
        </div>
      </div>
      {!alert.resolved && (
        <button
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] text-[var(--accent-green)] border border-[rgba(63,185,80,0.3)] hover:bg-[rgba(63,185,80,0.1)] transition-colors"
          onClick={onResolve}
        >
          <CheckCircle size={11} />
          Resolve
        </button>
      )}
    </div>
  );
}

function AlertRuleRow({ rule, onChange }: { rule: AlertRule; onChange: (updated: AlertRule) => void }) {
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const updated = { ...rule, enabled: !rule.enabled };
    setSaving(true);
    try {
      await apiRequest(`/api/alerts/rules/${rule.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      onChange(updated);
    } catch { /* revert on error by not calling onChange */ }
    setSaving(false);
  };

  const toggleNotify = async (field: 'notifyEmail' | 'notifyPush') => {
    const updated = { ...rule, [field]: !rule[field] };
    try {
      await apiRequest(`/api/alerts/rules/${rule.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      onChange(updated);
    } catch { /* ignore */ }
  };

  return (
    <div className="flex items-center gap-4 p-4 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-all">
      <span className="text-xl">{TYPE_ICONS[rule.type as AlertType] ?? '⚠️'}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{rule.description}</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
          {rule.threshold > 0 && <span>Threshold: <span className="text-[var(--text-secondary)]">{rule.threshold}%</span></span>}
          {rule.duration > 0 && <span className="ml-2">Duration: <span className="text-[var(--text-secondary)]">{rule.duration} min</span></span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
          onClick={() => toggleNotify('notifyEmail')}
          title="Toggle email notifications"
        >
          <Mail size={12} className={rule.notifyEmail ? 'text-[var(--accent-blue)]' : 'text-[var(--text-muted)]'} />
          <span className="text-[10px] text-[var(--text-muted)]">Email</span>
        </button>
        <button
          className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
          onClick={() => toggleNotify('notifyPush')}
          title="Toggle push notifications"
        >
          <Smartphone size={12} className={rule.notifyPush ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'} />
          <span className="text-[10px] text-[var(--text-muted)]">Push</span>
        </button>
        <button
          className={clsx(
            'relative w-10 h-5 rounded-full transition-all flex-shrink-0',
            rule.enabled ? 'bg-[var(--accent-green)]' : 'bg-[var(--bg-hover)]',
            saving ? 'opacity-50 cursor-wait' : ''
          )}
          onClick={toggle}
          disabled={saving}
        >
          <span className={clsx(
            'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
            rule.enabled ? 'left-5' : 'left-0.5'
          )} />
        </button>
        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-card)] transition-colors">
          <Settings2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function AlertCenter() {
  const { alerts: rawAlerts, alertRules, setAlerts, setAlertRules } = useStore();
  const [tab, setTab] = useState<'alerts' | 'rules'>('alerts');
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [typeFilter, setTypeFilter] = useState<AlertType | 'all'>('all');

  const alerts = rawAlerts.filter((a) => {
    if (filter === 'active' && a.resolved) return false;
    if (filter === 'resolved' && !a.resolved) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    return true;
  });

  const active = rawAlerts.filter((a) => !a.resolved);
  const critical = active.filter((a) => a.severity === 'critical');

  const resolveAlert = async (id: string) => {
    try {
      await apiRequest(`/api/alerts/${id}/resolve`, { method: 'POST' });
    } catch { /* best-effort — update UI regardless */ }
    setAlerts(rawAlerts.map((a) => a.id === id ? { ...a, resolved: true } : a));
  };

  const updateRule = (updated: AlertRule) => {
    setAlertRules(alertRules.map((r) => r.id === updated.id ? updated : r));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
        <div className="flex gap-3 flex-1">
          {[
            { label: 'Active', value: active.length, color: active.length ? 'text-[var(--accent-red)]' : 'text-[var(--accent-green)]' },
            { label: 'Critical', value: critical.length, color: critical.length ? 'text-[var(--accent-red)]' : 'text-white' },
            { label: 'Total', value: rawAlerts.length, color: 'text-white' },
            { label: 'Rules', value: alertRules.filter((r) => r.enabled).length, color: 'text-[var(--accent-blue)]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)]">
              <span className={`text-base font-bold ${color}`}>{value}</span>
              <span className="text-xs text-[var(--text-muted)]">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-0.5">
          {[['alerts', 'Alerts'], ['rules', 'Rules']].map(([id, label]) => (
            <button
              key={id}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === id ? 'bg-[var(--bg-card)] text-white' : 'text-[var(--text-muted)] hover:text-white'}`}
              onClick={() => setTab(id as typeof tab)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'alerts' ? (
        <>
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] flex-shrink-0 flex-wrap">
            <Filter size={12} className="text-[var(--text-muted)]" />
            <div className="flex items-center gap-1">
              {[['all', 'All'], ['active', 'Active'], ['resolved', 'Resolved']].map(([id, label]) => (
                <button
                  key={id}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filter === id ? 'bg-[var(--accent-blue)] bg-opacity-20 text-[var(--accent-blue)]' : 'text-[var(--text-muted)] hover:text-white'}`}
                  onClick={() => setFilter(id as typeof filter)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="w-px h-4 bg-[var(--border)]" />
            <div className="flex items-center gap-1">
              {(['all', 'cpu', 'memory', 'disk', 'service', 'docker'] as const).map((type) => (
                <button
                  key={type}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${typeFilter === type ? 'bg-[var(--bg-card)] text-white border border-[var(--border)]' : 'text-[var(--text-muted)] hover:text-white'}`}
                  onClick={() => setTypeFilter(type)}
                >
                  {type === 'all' ? 'All Types' : TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-[var(--text-muted)]">
                <CheckCircle size={32} className="mb-3 text-[var(--accent-green)]" />
                <div className="text-sm">No alerts match your filter</div>
              </div>
            ) : (
              alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onResolve={() => resolveAlert(alert.id)} />
              ))
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div className="text-xs text-[var(--text-muted)]">Configure when and how you get notified. Toggle email/push per rule, and enable/disable rules with the switch.</div>
          </div>
          {alertRules.map((rule) => (
            <AlertRuleRow key={rule.id} rule={rule} onChange={updateRule} />
          ))}
        </div>
      )}
    </div>
  );
}
