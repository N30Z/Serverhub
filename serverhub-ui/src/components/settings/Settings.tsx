import { useState } from 'react';
import { Server, Bell, Shield, Database, Palette, User, Save, ChevronRight } from 'lucide-react';

const SECTIONS = [
  { id: 'server', label: 'Server', icon: Server },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'auth', label: 'Authentication', icon: Shield },
  { id: 'monitoring', label: 'Monitoring', icon: Database },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'account', label: 'Account', icon: User },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-4 pb-2 border-b border-[var(--border)]">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--text-primary)]">{label}</div>
        {description && <div className="text-xs text-[var(--text-muted)] mt-0.5">{description}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`relative w-11 h-6 rounded-full transition-all ${value ? 'bg-[var(--accent-blue)]' : 'bg-[var(--bg-hover)]'}`}
      onClick={() => onChange(!value)}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${value ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

function ServerSettings() {
  const [host, setHost] = useState('0.0.0.0');
  const [port, setPort] = useState('8080');
  const [tls, setTls] = useState(true);

  return (
    <Section title="Server Configuration">
      <Field label="Bind Address" description="IP address the agent listens on. Use 0.0.0.0 to listen on all interfaces.">
        <input className="input w-40 text-xs" value={host} onChange={(e) => setHost(e.target.value)} />
      </Field>
      <Field label="Port" description="HTTP/HTTPS port for the web interface and API.">
        <input className="input w-24 text-xs" value={port} onChange={(e) => setPort(e.target.value)} type="number" />
      </Field>
      <Field label="TLS / HTTPS" description="Enable HTTPS with a TLS certificate. Strongly recommended for production.">
        <Toggle value={tls} onChange={setTls} />
      </Field>
      {tls && (
        <>
          <Field label="Certificate Path" description="Path to the TLS certificate file.">
            <input className="input w-56 text-xs font-mono" defaultValue="/etc/serverhub/cert.pem" />
          </Field>
          <Field label="Private Key Path" description="Path to the TLS private key file.">
            <input className="input w-56 text-xs font-mono" defaultValue="/etc/serverhub/key.pem" />
          </Field>
        </>
      )}
    </Section>
  );
}

function NotificationSettings() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  return (
    <Section title="Notification Channels">
      <Field label="Email Notifications" description="Send alert emails via SMTP.">
        <Toggle value={emailEnabled} onChange={setEmailEnabled} />
      </Field>
      {emailEnabled && (
        <>
          <Field label="SMTP Host">
            <input className="input w-48 text-xs" defaultValue="smtp.example.com" />
          </Field>
          <Field label="SMTP Port">
            <input className="input w-24 text-xs" defaultValue="587" type="number" />
          </Field>
          <Field label="From Address">
            <input className="input w-48 text-xs" defaultValue="serverhub@example.com" />
          </Field>
          <Field label="To Addresses" description="Comma-separated list of recipient emails.">
            <input className="input w-64 text-xs" defaultValue="admin@example.com" />
          </Field>
          <Field label="SMTP Username">
            <input className="input w-48 text-xs" />
          </Field>
          <Field label="SMTP Password">
            <input className="input w-48 text-xs" type="password" defaultValue="••••••••" />
          </Field>
        </>
      )}
      <div className="h-px bg-[var(--border)]" />
      <Field label="Android Push Notifications" description="Push notifications to the ServerHub Android app.">
        <Toggle value={pushEnabled} onChange={setPushEnabled} />
      </Field>
      {pushEnabled && (
        <div className="p-3 rounded-xl border border-[rgba(88,166,255,0.3)] bg-[rgba(88,166,255,0.05)] text-xs text-[var(--text-secondary)]">
          Pair your Android device by scanning the QR code in the ServerHub app, or enter the pairing code manually.
          <div className="flex items-center gap-3 mt-3">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-[8px] text-black">QR Code</div>
            <div>
              <div className="text-[var(--text-muted)] mb-1">Pairing Code</div>
              <div className="font-mono text-lg font-bold text-[var(--accent-blue)] tracking-widest">A7-BX-92</div>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

function AuthSettings() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('3600');

  return (
    <Section title="Authentication">
      <Field label="Two-Factor Authentication" description="Require TOTP 2FA for all logins.">
        <Toggle value={twoFactor} onChange={setTwoFactor} />
      </Field>
      <Field label="Session Timeout" description="Auto-logout inactive sessions after this many seconds.">
        <div className="flex items-center gap-2">
          <input className="input w-24 text-xs" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} type="number" />
          <span className="text-xs text-[var(--text-muted)]">seconds</span>
        </div>
      </Field>
      <Field label="Max Concurrent Sessions" description="Maximum simultaneous logins per user.">
        <input className="input w-24 text-xs" defaultValue="5" type="number" />
      </Field>
      <Field label="Change Password">
        <button className="btn-secondary text-xs">Change Password</button>
      </Field>
    </Section>
  );
}

function MonitoringSettings() {
  return (
    <Section title="Monitoring">
      <Field label="Poll Interval" description="How often to collect system metrics (seconds).">
        <div className="flex items-center gap-2">
          <input className="input w-24 text-xs" defaultValue="5" type="number" min="1" max="60" />
          <span className="text-xs text-[var(--text-muted)]">seconds</span>
        </div>
      </Field>
      <Field label="Metrics Retention" description="How long to keep historical metric data.">
        <select className="input w-32 text-xs">
          <option>7 days</option>
          <option>30 days</option>
          <option>90 days</option>
        </select>
      </Field>
      <Field label="Docker Monitoring" description="Monitor Docker containers and resource usage.">
        <Toggle value={true} onChange={() => {}} />
      </Field>
      <Field label="Temperature Sensors" description="Read hardware temperature sensors (requires lm-sensors).">
        <Toggle value={true} onChange={() => {}} />
      </Field>
    </Section>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  return (
    <Section title="Appearance">
      <Field label="Theme">
        <div className="flex items-center gap-2">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                theme === t
                  ? 'border-[var(--accent-blue)] bg-[rgba(88,166,255,0.1)] text-[var(--accent-blue)]'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:text-white'
              }`}
              onClick={() => setTheme(t)}
            >
              {t === 'dark' ? '🌙' : '☀️'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Compact Mode" description="Reduce spacing for higher information density.">
        <Toggle value={false} onChange={() => {}} />
      </Field>
      <Field label="Dashboard Auto-refresh" description="Automatically refresh dashboard data.">
        <Toggle value={true} onChange={() => {}} />
      </Field>
    </Section>
  );
}

const SECTION_CONTENT: Record<string, React.ReactNode> = {
  server: <ServerSettings />,
  notifications: <NotificationSettings />,
  auth: <AuthSettings />,
  monitoring: <MonitoringSettings />,
  appearance: <AppearanceSettings />,
  account: (
    <Section title="Account">
      <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #1d63ed, #7c3aed)' }}>A</div>
          <div>
            <div className="font-semibold text-white">admin</div>
            <div className="text-xs text-[var(--text-muted)]">Administrator · Local Account</div>
          </div>
        </div>
      </div>
    </Section>
  ),
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('server');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-full">
      {/* Left nav */}
      <div className="w-52 border-r border-[var(--border)] p-3 flex-shrink-0 bg-[var(--bg-secondary)]">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-2 mb-2">Settings</div>
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-item w-full mb-0.5 ${activeSection === id ? 'active' : ''}`}
            onClick={() => setActiveSection(id)}
          >
            <Icon size={15} />
            <span>{label}</span>
            <ChevronRight size={12} className="ml-auto opacity-40" />
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
        {SECTION_CONTENT[activeSection]}

        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border)]">
          <button className="btn-primary flex items-center gap-2" onClick={handleSave}>
            <Save size={14} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
          <button className="btn-secondary text-sm">Reset to Defaults</button>
        </div>
      </div>
    </div>
  );
}
