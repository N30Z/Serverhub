import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Plus, X, Terminal as TerminalIcon, Maximize2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface Tab {
  id: string;
  title: string;
}

const QUICK_KEYS = ['ls -la', 'cd ~', 'sudo su', 'df -h', 'free -h', 'top', 'ps aux', 'clear', 'Ctrl+C', 'Tab'];

const QUICK_KEY_SEND: Record<string, string> = {
  'Ctrl+C': '\x03',
  Tab: '\t',
  clear: 'clear\n',
};

function terminalWsUrl(token: string, cols: number, rows: number): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/terminal/ws?token=${encodeURIComponent(token)}&cols=${cols}&rows=${rows}`;
}

interface PaneProps {
  tabId: string;
  active: boolean;
  onConnectedChange: (tabId: string, connected: boolean) => void;
}

function TerminalPane({ tabId, active, onConnectedChange }: PaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const authToken = useStore((s) => s.authToken);

  useEffect(() => {
    if (!containerRef.current || !authToken) return;

    const term = new XTerm({
      fontFamily: '"SF Mono", "Fira Code", Menlo, Consolas, monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 5000,
      theme: {
        background: '#0d1117',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        selectionBackground: 'rgba(88,166,255,0.3)',
        black: '#484f58', red: '#ff7b72', green: '#3fb950', yellow: '#d29922',
        blue: '#58a6ff', magenta: '#bc8cff', cyan: '#39c5cf', white: '#b1bac4',
        brightBlack: '#6e7681', brightRed: '#ffa198', brightGreen: '#56d364',
        brightYellow: '#e3b341', brightBlue: '#79c0ff', brightMagenta: '#d2a8ff',
        brightCyan: '#56d4dd', brightWhite: '#f0f6fc',
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    term.writeln('\x1b[34m⚡ Connecting to agent shell…\x1b[0m');

    const ws = new WebSocket(terminalWsUrl(authToken, term.cols, term.rows));
    wsRef.current = ws;

    ws.onopen = () => onConnectedChange(tabId, true);
    ws.onclose = () => {
      onConnectedChange(tabId, false);
      term.writeln('\r\n\x1b[31m⚠ Connection closed\x1b[0m');
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (evt) => {
      const text = typeof evt.data === 'string' ? evt.data : '';
      if (text) term.write(text);
    };

    const dataSub = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });
    const resizeSub = term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });

    const handleWindowResize = () => fit.fit();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      dataSub.dispose();
      resizeSub.dispose();
      ws.close();
      term.dispose();
      wsRef.current = null;
      termRef.current = null;
      fitRef.current = null;
    };
  }, [authToken, tabId, onConnectedChange]);

  // Re-fit and focus whenever the pane becomes the active tab (container was hidden so size was stale)
  useEffect(() => {
    if (!active) return;
    const id = requestAnimationFrame(() => {
      fitRef.current?.fit();
      termRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [active]);

  const sendText = useCallback((text: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', data: text }));
    }
    termRef.current?.focus();
  }, []);

  // Expose sendText to the parent via a ref attribute on the container element
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as HTMLDivElement & { __sendText?: (t: string) => void }).__sendText = sendText;
    }
  }, [sendText]);

  return (
    <div
      ref={containerRef}
      data-tab-id={tabId}
      className="flex-1 min-h-0 px-2 py-2"
      style={{ display: active ? 'block' : 'none' }}
    />
  );
}

let tabCounter = 1;

export default function SSHTerminal() {
  const authToken = useStore((s) => s.authToken);
  const [tabs, setTabs] = useState<Tab[]>(() => [{ id: String(tabCounter), title: 'agent-shell' }]);
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const paneContainerRef = useRef<HTMLDivElement>(null);

  const handleConnectedChange = useCallback((tabId: string, c: boolean) => {
    setConnected((prev) => ({ ...prev, [tabId]: c }));
  }, []);

  const addTab = () => {
    tabCounter += 1;
    const id = String(tabCounter);
    setTabs((prev) => [...prev, { id, title: 'agent-shell' }]);
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
    const text = QUICK_KEY_SEND[key] ?? `${key} `;
    const el = paneContainerRef.current?.querySelector<HTMLDivElement & { __sendText?: (t: string) => void }>(`[data-tab-id="${activeTab}"]`);
    el?.__sendText?.(text);
  };

  if (!authToken) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] h-full">
        <div className="text-center">
          <TerminalIcon size={28} className="mx-auto mb-3 opacity-40" />
          <div className="text-sm">Sign in to open a terminal session</div>
        </div>
      </div>
    );
  }

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
            <TerminalIcon size={12} />
            <span>{tab.title}</span>
            <span className={`status-dot ${connected[tab.id] ? 'status-online' : 'status-offline'}`} style={{ width: 6, height: 6 }} />
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
          title="New session"
        >
          <Plus size={14} />
        </button>
        <div className="flex-1" />
        <div className="hidden lg:flex items-center gap-1 pb-2 pr-1">
          <span className="text-[10px] text-[var(--text-muted)] mr-1">Live shell on the agent host</span>
          <Maximize2 size={11} className="text-[var(--text-muted)]" />
        </div>
      </div>

      {/* Terminal panes (all mounted, only the active one shown — keeps WS sessions alive across tab switches) */}
      <div ref={paneContainerRef} className="flex-1 min-h-0 flex flex-col">
        {tabs.map((tab) => (
          <TerminalPane
            key={tab.id}
            tabId={tab.id}
            active={activeTab === tab.id}
            onConnectedChange={handleConnectedChange}
          />
        ))}
      </div>

      {/* Quick-key bar */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-secondary)] border-t border-[var(--border)] overflow-x-auto flex-shrink-0">
        {QUICK_KEYS.map((key) => (
          <button
            key={key}
            className="flex-shrink-0 px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--accent-blue)] transition-colors"
            onClick={() => injectQuickKey(key)}
            tabIndex={-1}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
