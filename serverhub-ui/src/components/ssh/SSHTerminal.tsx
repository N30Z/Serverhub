import { useState, useRef, useEffect } from 'react';
import { Plus, X, Maximize2, Wifi, WifiOff, Send, Terminal } from 'lucide-react';
import { useStore } from '../../store/useStore';

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
  'ls': [{ type: 'output', text: 'bin   boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var' }],
  'ls -la': [
    { type: 'output', text: 'total 72' },
    { type: 'output', text: 'drwxr-xr-x  18 root root 4096 Jun  3 10:00 .' },
    { type: 'output', text: 'drwxr-xr-x  18 root root 4096 Jun  3 10:00 ..' },
    { type: 'output', text: 'drwxr-xr-x   2 root root 4096 Jan 15 08:30 bin' },
    { type: 'output', text: 'drwxr-xr-x 124 root root 4096 Jun  3 10:00 etc' },
  ],
  'df -h': [
    { type: 'output', text: 'Filesystem      Size  Used Avail Use% Mounted on' },
    { type: 'output', text: '/dev/nvme0n1p2  490G  220G  250G  47% /' },
    { type: 'output', text: 'tmpfs           7.8G  8.0M  7.8G   1% /tmp' },
  ],
  'free -h': [
    { type: 'output', text: '              total        used        free      shared  buff/cache   available' },
    { type: 'output', text: 'Mem:            32G         18G        8.0G       256M        6.0G         14G' },
    { type: 'output', text: 'Swap:          8.0G        512M        7.5G' },
  ],
  'uptime': [{ type: 'output', text: ' 14:30:01 up 14 days,  2:15,  3 users,  load average: 1.82, 2.14, 1.95' }],
  'whoami': [{ type: 'output', text: 'admin' }],
  'pwd': [{ type: 'output', text: '/home/admin' }],
  'uname -a': [{ type: 'output', text: 'Linux prod-server-01 6.8.0-51-generic #52-Ubuntu SMP x86_64 GNU/Linux' }],
};

const QUICK_KEYS = ['ls', 'ls -la', 'cd ~', 'sudo su', 'df -h', 'free -h', 'uptime', 'ps aux', '|', '~', '/', 'Tab'];

function createTab(id: string, title = 'localhost', host = '127.0.0.1', connected = true): Tab {
  return {
    id, title, host, user: 'admin', connected,
    currentInput: '', inputHistory: [], histIdx: -1,
    history: connected ? [
      { type: 'system', text: `⚡ Connected to ${title} (${host}) as admin` },
      { type: 'system', text: 'Type commands below. Commands run on the server via the agent.' },
      { type: 'output', text: '' },
    ] : [
      { type: 'system', text: `⚠ Disconnected from ${title}` },
    ],
  };
}

// Prod: run commands via /api/exec; dev: use static demo responses
async function runCommand(
  cmd: string,
  token: string | null,
  isProd: boolean,
): Promise<TermLine[]> {
  if (!isProd || !token) {
    const demo = DEMO_RESPONSES[cmd];
    if (demo) return demo;
    if (!cmd) return [];
    return [{ type: 'error', text: `bash: ${cmd}: command not found` }];
  }

  try {
    const res = await fetch('/api/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ command: cmd, timeout: 10 }),
    });
    if (!res.ok) {
      return [{ type: 'error', text: `Error: ${res.statusText}` }];
    }
    const data: { stdout: string; stderr: string; exitCode: number } = await res.json();
    const lines: TermLine[] = [];
    if (data.stdout) {
      data.stdout.split('\n').forEach((l) => {
        if (l !== '') lines.push({ type: 'output', text: l });
      });
    }
    if (data.stderr) {
      data.stderr.split('\n').forEach((l) => {
        if (l !== '') lines.push({ type: 'error', text: l });
      });
    }
    return lines;
  } catch (e) {
    return [{ type: 'error', text: `Network error: ${(e as Error).message}` }];
  }
}

export default function SSHTerminal() {
  const authToken = useStore((s) => s.authToken);
  const isProd = import.meta.env.PROD;

  const [tabs, setTabs] = useState<Tab[]>([createTab('1', 'localhost', '127.0.0.1', true)]);
  const [activeTab, setActiveTab] = useState('1');
  const [tabCounter, setTabCounter] = useState(2);
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

  const submitCommand = async (cmd: string) => {
    const tab = currentTab;
    const promptLine: TermLine = {
      type: 'prompt',
      text: cmd,
      prompt: `admin@${tab.title}:~$`,
    };

    // Optimistically add the prompt line
    updateTab(tab.id, (t) => ({
      ...t,
      history: [...t.history, promptLine],
      inputHistory: cmd ? [cmd, ...t.inputHistory.slice(0, 49)] : t.inputHistory,
      currentInput: '',
      histIdx: -1,
    }));

    if (!cmd) return;

    const responseLines = await runCommand(cmd, authToken, isProd);
    updateTab(tab.id, (t) => ({
      ...t,
      history: [...t.history, ...responseLines],
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
      currentInput: t.currentInput + (key === 'Tab' ? '' : key),
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
              <span className="ml-1 opacity-50 hover:opacity-100 hover:text-[var(--accent-red)]" onClick={(e) => closeTab(tab.id, e)}>
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
          {isProd && authToken && (
            <a
              href={`/terminal?token=${authToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[var(--text-muted)] hover:text-white border border-[var(--border)] transition-colors"
              title="Open full PTY terminal in new tab"
            >
              <Maximize2 size={11} />Full terminal
            </a>
          )}
          {(!isProd || !authToken) && <Maximize2 size={11} className="text-[var(--text-muted)] hover:text-white cursor-pointer" />}
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
              <div className="terminal-output">{line.text || ' '}</div>
            )}
          </div>
        ))}

        {currentTab.connected && (
          <div className="flex gap-2 items-center mt-0.5">
            <span className="terminal-prompt flex-shrink-0">admin@{currentTab.title}:~$</span>
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
          <span className="terminal-prompt text-[12px] flex-shrink-0">admin@{currentTab.title}:~$</span>
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
            placeholder={currentTab.connected ? '' : 'Disconnected'}
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
