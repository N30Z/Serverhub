import { useState } from 'react';
import { Plus, Play, Trash2, Edit2, Clock, CheckCircle, XCircle, Loader2, X, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { apiRequest } from '../../api/client';
import type { CronJob, CronExecution } from '../../types';

const SCHEDULE_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Daily at 2am', value: '0 2 * * *' },
  { label: 'Weekly (Sunday)', value: '0 0 * * 0' },
  { label: 'Monthly (1st)', value: '0 0 1 * *' },
];

function humanSchedule(cron: string): string {
  const preset = SCHEDULE_PRESETS.find((p) => p.value === cron);
  if (preset) return preset.label;
  const [min, hour] = cron.split(' ');
  if (min === '0' && hour !== '*') return `Daily at ${hour.padStart(2, '0')}:00`;
  if (min.startsWith('*/')) return `Every ${min.slice(2)} minutes`;
  return cron;
}

function HistoryModal({ job, onClose }: { job: CronJob; onClose: () => void }) {
  const [history, setHistory] = useState<CronExecution[] | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    apiRequest<CronExecution[]>(`/api/cron/${job.id}/history`)
      .then((h) => { setHistory(h); setLoading(false); })
      .catch(() => { setHistory([]); setLoading(false); });
  });

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal w-[640px] max-w-[95vw] animate-slide-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold">Execution History — {job.name}</h2>
          <button className="text-[var(--text-muted)] hover:text-white" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
          {loading && <div className="p-6 text-center text-[var(--text-muted)]"><Loader2 size={20} className="animate-spin mx-auto" /></div>}
          {!loading && (!history || history.length === 0) && (
            <div className="p-6 text-center text-xs text-[var(--text-muted)]">No executions recorded yet.</div>
          )}
          {history?.map((e) => (
            <div key={e.id} className="px-6 py-3 border-b border-[var(--border-subtle)] text-sm">
              <div className="flex items-center gap-3 mb-1">
                {e.status === 'success'
                  ? <CheckCircle size={14} className="text-[var(--accent-green)]" />
                  : <XCircle size={14} className="text-[var(--accent-red)]" />}
                <span className={e.status === 'success' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}>{e.status}</span>
                <span className="text-[var(--text-muted)] text-xs">exit {e.exitCode}</span>
                <span className="text-[var(--text-muted)] text-xs ml-auto">{new Date(e.startTime).toLocaleString()} · {e.duration}ms</span>
              </div>
              {e.output && (
                <pre className="text-[10px] font-mono bg-[var(--bg-tertiary)] rounded p-2 mt-1 overflow-x-auto text-[var(--text-secondary)] whitespace-pre-wrap" style={{ maxHeight: 120 }}>
                  {e.output}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CronEditorModal({ job, onSave, onClose }: { job: CronJob | null; onSave: (j: CronJob) => void; onClose: () => void }) {
  const [name, setName] = useState(job?.name ?? '');
  const [command, setCommand] = useState(job?.command ?? '');
  const [user, setUser] = useState(job?.user ?? 'root');
  const [schedule, setSchedule] = useState(job?.schedule ?? '0 * * * *');
  const [usePreset, setUsePreset] = useState(true);
  const [description, setDescription] = useState(job?.description ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [min, hour, dom, month, dow] = schedule.split(' ');
  const scheduleParts = { min, hour, dom, month, dow };

  const handleSave = async () => {
    if (!name || !command) { setErr('Name and command are required'); return; }
    setSaving(true);
    setErr(null);
    try {
      const payload = { name, command, user, schedule, description, enabled: true };
      let saved: CronJob;
      if (job) {
        saved = await apiRequest<CronJob>(`/api/cron/${job.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...payload, id: job.id }),
        });
      } else {
        saved = await apiRequest<CronJob>('/api/cron', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      onSave(saved);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="modal w-[560px] max-w-[95vw] animate-slide-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-semibold">{job ? 'Edit Cron Job' : 'New Cron Job'}</h2>
          <button className="text-[var(--text-muted)] hover:text-white" onClick={onClose}>✕</button>
        </div>
        <div className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {err && <div className="text-xs text-[var(--accent-red)] p-3 rounded-lg bg-[rgba(248,81,73,0.1)] border border-[rgba(248,81,73,0.3)]">{err}</div>}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Job Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Database Backup" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Command</label>
            <input className="input font-mono text-xs" value={command} onChange={(e) => setCommand(e.target.value)} placeholder="/usr/local/bin/backup.sh" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Run As User</label>
            <input className="input w-32" value={user} onChange={(e) => setUser(e.target.value)} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Schedule</label>
              <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-0.5">
                <button className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${usePreset ? 'bg-[var(--bg-card)] text-white' : 'text-[var(--text-muted)]'}`} onClick={() => setUsePreset(true)}>Presets</button>
                <button className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${!usePreset ? 'bg-[var(--bg-card)] text-white' : 'text-[var(--text-muted)]'}`} onClick={() => setUsePreset(false)}>Custom</button>
              </div>
            </div>
            {usePreset ? (
              <div className="grid grid-cols-2 gap-2">
                {SCHEDULE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    className={`px-3 py-2 rounded-lg text-left text-xs transition-all border ${
                      schedule === preset.value
                        ? 'border-[var(--accent-blue)] bg-[rgba(88,166,255,0.1)] text-[var(--accent-blue)]'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-white'
                    }`}
                    onClick={() => setSchedule(preset.value)}
                  >
                    <div className="font-medium">{preset.label}</div>
                    <div className="font-mono text-[10px] opacity-60 mt-0.5">{preset.value}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { key: 'min', label: 'Minute', placeholder: '0-59' },
                    { key: 'hour', label: 'Hour', placeholder: '0-23' },
                    { key: 'dom', label: 'Day of Month', placeholder: '1-31' },
                    { key: 'month', label: 'Month', placeholder: '1-12' },
                    { key: 'dow', label: 'Day of Week', placeholder: '0-7' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] text-[var(--text-muted)] mb-1">{label}</label>
                      <input
                        className="input text-xs text-center font-mono py-2"
                        value={scheduleParts[key as keyof typeof scheduleParts]}
                        placeholder={placeholder}
                        onChange={(e) => {
                          const parts = schedule.split(' ');
                          const idx = ['min', 'hour', 'dom', 'month', 'dow'].indexOf(key);
                          parts[idx] = e.target.value;
                          setSchedule(parts.join(' '));
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-tertiary)] text-xs">
                  <span className="text-[var(--text-muted)]">Preview: </span>
                  <span className="font-mono text-[var(--accent-blue)]">{schedule}</span>
                  <span className="text-[var(--text-muted)] ml-2">— {humanSchedule(schedule)}</span>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Description (optional)</label>
            <textarea className="input resize-none text-xs" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this job do?" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[var(--border)]">
          <button className="btn-secondary text-xs" onClick={onClose}>Cancel</button>
          <button className="btn-primary text-xs flex items-center gap-1.5" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={12} className="animate-spin" />}
            {job ? 'Save Changes' : 'Create Job'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CronJobRow({ job, onEdit, onDelete, onRun, onHistory }: {
  job: CronJob;
  onEdit: (job: CronJob) => void;
  onDelete: (id: string) => void;
  onRun: (job: CronJob) => void;
  onHistory: (job: CronJob) => void;
}) {
  const StatusIcon = job.lastStatus === 'success' ? CheckCircle
    : job.lastStatus === 'failed' ? XCircle
    : job.lastStatus === 'running' ? Loader2
    : Clock;

  const statusColor = job.lastStatus === 'success' ? 'var(--accent-green)'
    : job.lastStatus === 'failed' ? 'var(--accent-red)'
    : job.lastStatus === 'running' ? 'var(--accent-blue)'
    : 'var(--text-muted)';

  return (
    <div className="grid items-center px-4 py-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-all text-sm"
      style={{ gridTemplateColumns: '1.5rem 1fr 12rem 10rem 8rem 7rem 7rem 7rem' }}>
      <div className={`status-dot flex-shrink-0 ${job.enabled ? 'status-online' : 'status-offline'}`} />
      <div className="min-w-0 pr-4">
        <div className="font-medium text-white truncate">{job.name}</div>
        <div className="text-[11px] text-[var(--text-muted)] font-mono truncate mt-0.5">{job.command}</div>
      </div>
      <div className="text-xs">
        <div className="text-[var(--text-secondary)]">{humanSchedule(job.schedule)}</div>
        <div className="font-mono text-[10px] text-[var(--text-muted)] mt-0.5">{job.schedule}</div>
      </div>
      <div className="text-[11px] text-[var(--text-muted)]">
        {job.lastRun ? new Date(job.lastRun).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
      </div>
      <div className="text-[11px] text-[var(--text-muted)]">
        {job.nextRun !== '—' ? new Date(job.nextRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
      </div>
      <div className="flex items-center gap-1.5" style={{ color: statusColor }}>
        <StatusIcon size={13} className={job.lastStatus === 'running' ? 'animate-spin' : ''} />
        <span className="text-[11px] capitalize">{job.lastStatus ?? 'never'}</span>
      </div>
      <div className="text-[11px] text-[var(--text-muted)]">{job.user}</div>
      <div className="flex items-center gap-1 justify-end">
        <button className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--accent-green)] transition-colors" title="Run now" onClick={() => onRun(job)}>
          <Play size={12} />
        </button>
        <button className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-white transition-colors" title="History" onClick={() => onHistory(job)}>
          <ChevronDown size={12} />
        </button>
        <button className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--accent-blue)] transition-colors" title="Edit" onClick={() => onEdit(job)}>
          <Edit2 size={12} />
        </button>
        <button className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--accent-red)] transition-colors" title="Delete" onClick={() => onDelete(job.id)}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function CronManager() {
  const { cronJobs, setCronJobs } = useStore();
  const [editingJob, setEditingJob] = useState<CronJob | null | undefined>(undefined);
  const [historyJob, setHistoryJob] = useState<CronJob | null>(null);
  const [runResult, setRunResult] = useState<{ job: string; status: string; output: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeJobs = cronJobs.filter((j) => j.enabled);
  const failedJobs = cronJobs.filter((j) => j.lastStatus === 'failed');

  const handleSave = (saved: CronJob) => {
    setCronJobs(
      cronJobs.some((j) => j.id === saved.id)
        ? cronJobs.map((j) => j.id === saved.id ? saved : j)
        : [...cronJobs, saved]
    );
    setEditingJob(undefined);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await apiRequest(`/api/cron/${id}`, { method: 'DELETE' });
      setCronJobs(cronJobs.filter((j) => j.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleRun = async (job: CronJob) => {
    setError(null);
    setRunResult(null);
    try {
      const exec = await apiRequest<CronExecution>(`/api/cron/${job.id}/run`, { method: 'POST' });
      setRunResult({ job: job.name, status: exec.status, output: exec.output });
    } catch (e) {
      setError(`Run ${job.name}: ${(e as Error).message}`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
        <div className="flex gap-3 flex-1">
          {[
            { label: 'Total Jobs', value: cronJobs.length, color: 'text-white' },
            { label: 'Active', value: activeJobs.length, color: 'text-[var(--accent-green)]' },
            { label: 'Failed', value: failedJobs.length, color: failedJobs.length ? 'text-[var(--accent-red)]' : 'text-white' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)]">
              <span className={`text-base font-bold ${color}`}>{value}</span>
              <span className="text-xs text-[var(--text-muted)]">{label}</span>
            </div>
          ))}
        </div>
        {error && <span className="text-xs text-[var(--accent-red)] truncate max-w-xs">{error}</span>}
        <button className="btn-primary text-xs flex items-center gap-1.5" onClick={() => setEditingJob(null)}>
          <Plus size={13} />
          New Cron Job
        </button>
      </div>

      {runResult && (
        <div className={`px-4 py-2 border-b text-xs flex items-start gap-3 ${runResult.status === 'success' ? 'border-[rgba(63,185,80,0.3)] bg-[rgba(63,185,80,0.05)]' : 'border-[rgba(248,81,73,0.3)] bg-[rgba(248,81,73,0.05)]'}`}>
          <span className={`font-semibold ${runResult.status === 'success' ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>{runResult.job}: {runResult.status}</span>
          {runResult.output && <span className="font-mono text-[var(--text-muted)] truncate">{runResult.output.trim()}</span>}
          <button className="ml-auto text-[var(--text-muted)] hover:text-white" onClick={() => setRunResult(null)}><X size={12} /></button>
        </div>
      )}

      <div className="grid text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex-shrink-0"
        style={{ gridTemplateColumns: '1.5rem 1fr 12rem 10rem 8rem 7rem 7rem 7rem' }}>
        <span /><span>Job / Command</span><span>Schedule</span><span>Last Run</span><span>Next Run</span><span>Status</span><span>User</span><span className="text-right">Actions</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {cronJobs.map((job) => (
          <CronJobRow
            key={job.id}
            job={job}
            onEdit={setEditingJob}
            onDelete={handleDelete}
            onRun={handleRun}
            onHistory={setHistoryJob}
          />
        ))}
      </div>

      {editingJob !== undefined && (
        <CronEditorModal job={editingJob} onSave={handleSave} onClose={() => setEditingJob(undefined)} />
      )}
      {historyJob && (
        <HistoryModal job={historyJob} onClose={() => setHistoryJob(null)} />
      )}
    </div>
  );
}
