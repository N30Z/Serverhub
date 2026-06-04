import { useState, useRef, useEffect } from 'react';
import { Plus, X, Maximize2, Wifi, WifiOff, Send, Terminal } from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  host: string;
  user: string;
  connected: boolean;
  history: TermLine[];
  inputHistory: string[];
  histIdx: number;
  currentInput: string;
}

interface TermLine {
  type: 'prompt' | 'output' | 'error' | 'system';
  text: string;
  prompt?: string;
}

const DEMO_RESPONSES: Record<string, TermLine[]> = {
  'ls': [
    { type: 'output', text: 'bin   boot  dev  etc  home  lib  lib64  lost+found  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var' },
  ],
  'ls -la': [
    { type: 'output', text: 'total 72' },
    { type: 'output', text: 'drwxr-xr-x  18 root root 4096 Jun  3 10:00 .' },
    { type: 'output', text: 'drwxr-xr-x  18 root root 4096 Jun  3 10:00 ..' },
    { type: 'output', text: 'drwxr-xr-x   2 root root 4096 Jan 15 08:30 bin' },
    { type: 'output', text: 'drwxr-xr-x   4 root root 4096 Jun  3 10:00 boot' },
    { type: 'output', text: 'drwxr-xr-x  17 root root 3340 Jun  3 10:00 dev' },
    { type: 'output', text: 'drwxr-xr-x 124 root root 4096 Jun  3 10:00 etc' },
  ],
  'df -h': [
    { type: 'output', text: 'Filesystem      Size  Used Avail Use% Mounted on' },
    { type: 'output', text: '/dev/nvme0n1p2  490G  220G  250G  47% /' },
    { type: 'output', text: '/dev/sda1       2.0T  800G  1.2T  40% /data' },
    { type: 'output', text: '/dev/sdb1       3.9T  3.2T  700G  82% /backup' },
    { type: 'output', text: 'tmpfs           7.8G  8.0M  7.8G   1% /tmp' },
  ],
  'top': [
    { type: 'output', text: 'top - 14:30:01 up 14 days,  2:15,  3 users,  load average: 1.82, 2.14, 1.95' },
    { type: 'output', text: 'Tasks: 287 total,   1 running, 286 sleeping,   0 stopped,   0 zombie' },
    { type: 'output', text: '%Cpu(s): 42.3 us,  5.1 sy,  0.0 ni, 51.2 id,  1.1 wa,  0.0 hi,  0.3 si' },
    { type: 'output', text: 'MiB Mem : 32768.0 total,  8192.0 free, 18432.0 used,  6144.0 buff/cache' },
    { type: 'output', text: '' },
    { type: 'output', text: '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND' },
    { type: 'output', text: ' 4120 worker    20   0  512m  103m   21m R  22.1   0.3   1:45.32 python3' },
    { type: 'output', text: ' 3891 app       20   0  1.2g  284m   45m S  12.8   0.9  12:32.10 node' },
    { type: 'output', text: ' 1245 postgres  20   0  512m  132m   12m S   8.2   0.4  45:21.08 postgres' },
  ],
  'ps aux': [
    { type: 'output', text: 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND' },
    { type: 'output', text: 'root         1  0.0  0.0 169524 13956 ?        Ss   Jun01   0:08 /sbin/init' },
    { type: 'output', text: 'root       823  0.0  0.0  36104  7284 ?        Ss   Jun01   0:00 /usr/sbin/sshd' },
    { type: 'output', text: 'www-data  2380  1.4  0.3 121424  9832 ?        S    Jun01  28:14 nginx: worker' },
    { type: 'output', text: 'postgres  1245  8.2  4.1 524288 134216 ?      Ss   Jun01  45:21 postgres: main' },
    { type: 'output', text: 'app       3891 12.8  8.7 1.2g   283m ?        Sl   10:00  12:32 node server.js' },
  ],
  'free -h': [
    { type: 'output', text: '              total        used        free      shared  buff/cache   available' },
    { type: 'output', text: 'Mem:            32G         18G        8.0G       256M        6.0G         14G' },
    { type: 'output', text: 'Swap:          8.0G        512M        7.5G' },
  ],
  'uptime': [
    { type: 'output', text: ' 14:30:01 up 14 days,  2:15,  3 users,  load average: 1.82, 2.14, 1.95' },
  ],
  'whoami': [{ type: 'output', text: 'admin' }],
  'pwd': [{ type: 'output', text: '/home/admin' }],
  'uname -a': [
    { type: 'output', text: 'Linux prod-server-01 6.8.0-51-generic #52-Ubuntu SMP PREEMPT_DYNAMIC Thu Mar 27 14:01:07 UTC 2025 x86_64 x86_64 x86_64 GNU/Linux' },
  ],
  'docker ps': [
    { type: 'output', text: 'CONTAINER ID   IMAGE                  COMMAND                  STATUS          PORTS' },
    { type: 'output', text: 'a1b2c3d4e5f6   node:20-alpine         "docker-entrypoint.s…"   Up 2 days       80/tcp, 443/tcp' },
    { type: 'output', text: 'b2c3d4e5f6a1   postgres:16            "docker-entrypoint.s…"   Up 2 days       5432/tcp' },
    { type: 'output', text: 'c3d4e5f6a1b2   redis:7-alpine         "docker-entrypoint.s…"   Up 2 days       6379/tcp' },
    { type: 'output', text: 'f6a1b2c3d4e5   grafana/grafana        "/run.sh"                Up 5 days       3000/tcp' },
  ],
  'systemctl status nginx': [
    { type: 'output', text: '● nginx.service - A high performance web server and a reverse proxy server' },
    { type: 'output', text: '     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)' },
    { type: 'output', text: '     Active: active (running) since Mon 2025-06-01 10:00:00 UTC; 2 days ago' },
    { type: 'output', text: '   Main PID: 2381 (nginx)' },
    { type: 'output', text: '      Tasks: 9 (limit: 38467)' },
    { type: 'output', text: '     Memory: 12.4M' },
  ],
};

const QUICK_KEYS = ['ls', 'ls -la', 'cd ~', 'sudo su', 'df -h', 'free -h', 'top', 'ps aux', '|', '~', '/', 'Tab'];

function createTab(id: string, title = 'prod-server-01', host = '192.168.1.100', connected = true): Tab {
  if (!connected) {
    return {
      id, title, host, user: 'admin', connected: false,
      currentInput: '', inputHistory: [], histIdx: -1,
      history: [
        { type: 'system', text: `⚠ Connection to ${title} (${host}:22) closed` },
        { type: 'system', text: 'Press Enter or type a command to reconnect' },
      ],
    };
  }
  return {
    id, title, host, user: 'admin', connected: true,
    currentInput: '', inputHistory: [], histIdx: -1,
    history: [
      { type: 'system', text: `⚡ Connected to ${title} (${host}:22) as admin` },
      { type: 'system', text: 'ServerHub SSH Client v1.0 — Type commands below' },
      { type: 'output', text: '' },
      { type: 'output', text: `Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-51-generic x86_64)` },
      { type: 'output', text: '' },
      { type: 'output', text: '  System load:  1.82               Users logged in:          3' },
      { type: 'output', text: '  Usage of /:   44.2% of 490.0GB  Memory usage:             56%' },
      { type: 'output', text: '  Swap usage:   6%                 Processes:               287' },
      { type: 'output', text: '' },
    ],
  };
}

const INITIAL_TABS: Tab[] = [
  createTab('1', 'prod-server-01', '192.168.1.100', true),
  createTab('2', 'db-replica-02', '192.168.1.101', false),
];

export default function SSHTerminal() {
  const [tabs, setTabs] = useState<Tab[]>(INITIAL_TABS);
  const [activeTab, setActiveTab] = useState('1');
  const [tabCounter, setTabCounter] = useState(3);
  const termEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  useEffect(() => {
    termEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTab?.history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeTab]);

  const updateTab = (id: string, updater: (t: Tab) => Tab) => {
    setTabs((prev) => prev.map((t) => t.id === id ? updater(t) : t));
  };

  const submitCommand = (cmd: string) => {
    const tab = currentTab;
    const promptLine: TermLine = {
      type: 'prompt',
      text: cmd,
      prompt: `admin@${tab.host.split('.').pop()}:~$`,
    };
    const responseLines = DEMO_RESPONSES[cmd]
      ?? (cmd === '' ? [] : [{ type: 'output' as const, text: `bash: ${cmd}: command not found` }]);

    updateTab(tab.id, (t) => ({
      ...t,
      history: [...t.history, promptLine, ...responseLines],
      inputHistory: cmd ? [cmd, ...t.inputHistory.slice(0, 49)] : t.inputHistory,
      currentInput: '',
      histIdx: -1,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const tab = currentTab;
    if (e.key === 'Enter') {
      submitCommand(tab.currentInput.trim());
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      updateTab(tab.id, (t) => {
        const idx = Math.min(t.histIdx + 1, t.inputHistory.length - 1);
        return { ...t, histIdx: idx, currentInput: t.inputHistory[idx] ?? t.currentInput };
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      updateTab(tab.id, (t) => {
        const idx = Math.max(t.histIdx - 1, -1);
        return { ...t, histIdx: idx, currentInput: idx === -1 ? '' : (t.inputHistory[idx] ?? '') };
      });
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      updateTab(tab.id, (t) => ({ ...t, history: [] }));
    }
  };

  const addTab = () => {
    const id = String(tabCounter);
    setTabCounter((c) => c + 1);
    setTabs((prev) => [...prev, createTab(id)]);
    setActiveTab(id);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter((t) => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id) setActiveTab(newTabs[newTabs.length - 1].id);
  };

  const injectQuickKey = (key: string) => {
    updateTab(currentTab.id, (t) => ({
      ...t,
      currentInput: t.currentInput + key + (key === 'Tab' ? '\t' : ' ').trimEnd(),
    }));
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-0 bg-[var(--bg-secondary)] border-b border-[var(--border)] overflow-x-auto flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs font-medium transition-all flex-shrink-0 border-b-2 ${
              activeTab === tab.id
                ? 'bg-[var(--bg-primary)] text-white border-[var(--accent-blue)]'
                : 'text-[var(--text-muted)] border-transparent hover:text-white hover:bg-[var(--bg-hover)]'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Terminal size={12} className={tab.connected ? '' : 'opacity-40'} />
            <span>{tab.title}</span>
            {tab.connected
              ? <span className="status-dot status-online" style={{ width: 6, height: 6 }} />
              : <span className="status-dot status-offline" style={{ width: 6, height: 6 }} />
            }
            {tabs.length > 1 && (
              <span
                className="ml-1 opacity-50 hover:opacity-100 hover:text-[var(--accent-red)]"
                onClick={(e) => closeTab(tab.id, e)}
              >
                <X size={10} />
              </span>
            )}
          </button>
        ))}
        <button
          className="flex items-center gap-1 px-2 py-2 rounded-t-lg text-[var(--text-muted)] hover:text-white transition-colors flex-shrink-0"
          onClick={addTab}
        >
          <Plus size={14} />
        </button>
        <div className="flex-1" />
        <div className="hidden lg:flex items-center gap-1 pb-2 pr-1">
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border)] font-mono text-[10px] text-[var(--text-secondary)]">↑↓</kbd>
          <span className="text-[10px] text-[var(--text-muted)] mr-2">history</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border)] font-mono text-[10px] text-[var(--text-secondary)]">Ctrl+L</kbd>
          <span className="text-[10px] text-[var(--text-muted)] mr-2">clear</span>
          <Maximize2 size={11} className="text-[var(--text-muted)] hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* Terminal output */}
      <div
        className="flex-1 overflow-y-auto p-4 terminal-container cursor-text min-h-0"
        onClick={() => inputRef.current?.focus()}
      >
        {currentTab.history.map((line, i) => (
          <div key={i} className="leading-[1.55]">
            {line.type === 'prompt' ? (
              <div className="flex gap-2">
                <span className="terminal-prompt flex-shrink-0">{line.prompt}</span>
                <span className="terminal-cmd">{line.text}</span>
              </div>
            ) : line.type === 'system' ? (
              <div className="text-[var(--accent-blue)] text-[11px] mb-1">{line.text}</div>
            ) : line.type === 'error' ? (
              <div className="terminal-error">{line.text}</div>
            ) : (
              <div className="terminal-output">{line.text || ' '}</div>
            )}
          </div>
        ))}

        {/* Blinking cursor line */}
        {currentTab.connected && (
          <div className="flex gap-2 items-center mt-0.5">
            <span className="terminal-prompt flex-shrink-0">admin@{currentTab.host.split('.').pop()}:~$</span>
            <span className="terminal-output opacity-40">{currentTab.currentInput}</span>
            <span className="inline-block w-[9px] h-[15px] bg-white align-middle" style={{ animation: 'sh-blink 1.1s step-end infinite' }} />
          </div>
        )}
        <div ref={termEndRef} />
      </div>

      {/* Quick-key bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-secondary)] border-t border-[var(--border)] overflow-x-auto flex-shrink-0">
        {QUICK_KEYS.map((key) => (
          <button
            key={key}
            className="flex-shrink-0 px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-blue)] transition-colors"
            onClick={() => injectQuickKey(key === 'Tab' ? '' : key)}
            tabIndex={-1}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Command input bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-1.5 focus-within:border-[var(--accent-blue)] transition-colors">
          {currentTab.connected
            ? <Wifi size={12} className="text-[var(--accent-green)] flex-shrink-0" />
            : <WifiOff size={12} className="text-[var(--text-muted)] flex-shrink-0" />
          }
          <span className="terminal-prompt text-[12px] flex-shrink-0">
            admin@{currentTab.host.split('.').pop()}:~$
          </span>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-white terminal-container text-[13px] caret-[var(--accent-blue)] min-w-0"
            value={currentTab.currentInput}
            onChange={(e) => updateTab(currentTab.id, (t) => ({ ...t, currentInput: e.target.value }))}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={currentTab.connected ? '' : 'Disconnected — press Enter to reconnect'}
          />
        </div>
        <button
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
          onClick={() => submitCommand(currentTab.currentInput.trim())}
        >
          <Send size={12} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
