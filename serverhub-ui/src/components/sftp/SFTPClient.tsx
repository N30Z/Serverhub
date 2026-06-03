import { useState } from 'react';
import {
  Folder, FileText, Upload, Download, Trash2, Edit2, Plus,
  RefreshCw, ChevronRight, ChevronLeft, Home, Search,
  Archive, Eye, MoreHorizontal, FolderPlus, ArrowUp
} from 'lucide-react';
import type { SFTPEntry } from '../../types';

const ROOT_ENTRIES: SFTPEntry[] = [
  { name: 'etc', path: '/etc', type: 'directory', size: 0, permissions: 'drwxr-xr-x', owner: 'root', group: 'root', modified: '2025-06-01 10:00', isHidden: false },
  { name: 'home', path: '/home', type: 'directory', size: 0, permissions: 'drwxr-xr-x', owner: 'root', group: 'root', modified: '2025-06-01 10:00', isHidden: false },
  { name: 'var', path: '/var', type: 'directory', size: 0, permissions: 'drwxr-xr-x', owner: 'root', group: 'root', modified: '2025-06-03 09:15', isHidden: false },
  { name: 'opt', path: '/opt', type: 'directory', size: 0, permissions: 'drwxr-xr-x', owner: 'root', group: 'root', modified: '2025-05-20 14:30', isHidden: false },
  { name: 'tmp', path: '/tmp', type: 'directory', size: 0, permissions: 'drwxrwxrwt', owner: 'root', group: 'root', modified: '2025-06-03 14:20', isHidden: false },
  { name: 'srv', path: '/srv', type: 'directory', size: 0, permissions: 'drwxr-xr-x', owner: 'root', group: 'root', modified: '2025-05-10 11:00', isHidden: false },
];

const HOME_ENTRIES: SFTPEntry[] = [
  { name: '.bashrc', path: '/home/admin/.bashrc', type: 'file', size: 3526, permissions: '-rw-r--r--', owner: 'admin', group: 'admin', modified: '2025-01-10 08:00', isHidden: true },
  { name: '.ssh', path: '/home/admin/.ssh', type: 'directory', size: 0, permissions: 'drwx------', owner: 'admin', group: 'admin', modified: '2025-05-15 12:00', isHidden: true },
  { name: 'projects', path: '/home/admin/projects', type: 'directory', size: 0, permissions: 'drwxr-xr-x', owner: 'admin', group: 'admin', modified: '2025-06-02 18:30', isHidden: false },
  { name: 'backups', path: '/home/admin/backups', type: 'directory', size: 0, permissions: 'drwxr-xr-x', owner: 'admin', group: 'admin', modified: '2025-06-03 02:00', isHidden: false },
  { name: 'config.yaml', path: '/home/admin/config.yaml', type: 'file', size: 2048, permissions: '-rw-r--r--', owner: 'admin', group: 'admin', modified: '2025-06-01 09:45', isHidden: false },
  { name: 'deploy.sh', path: '/home/admin/deploy.sh', type: 'file', size: 4096, permissions: '-rwxr-xr-x', owner: 'admin', group: 'admin', modified: '2025-06-02 15:20', isHidden: false },
  { name: 'README.md', path: '/home/admin/README.md', type: 'file', size: 1024, permissions: '-rw-r--r--', owner: 'admin', group: 'admin', modified: '2025-05-30 11:00', isHidden: false },
  { name: 'database-backup-20250603.sql.gz', path: '/home/admin/backups/database-backup-20250603.sql.gz', type: 'file', size: 524288000, permissions: '-rw-r--r--', owner: 'admin', group: 'admin', modified: '2025-06-03 02:00', isHidden: false },
  { name: 'logs.tar.gz', path: '/home/admin/logs.tar.gz', type: 'file', size: 10485760, permissions: '-rw-r--r--', owner: 'admin', group: 'admin', modified: '2025-06-02 23:00', isHidden: false },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function getFileIcon(entry: SFTPEntry) {
  if (entry.type === 'directory') return <Folder size={16} className="text-[var(--accent-blue)] flex-shrink-0" />;
  const ext = entry.name.split('.').pop()?.toLowerCase();
  if (['gz', 'tar', 'zip', 'bz2'].includes(ext ?? '')) return <Archive size={16} className="text-[var(--accent-yellow)] flex-shrink-0" />;
  return <FileText size={16} className="text-[var(--text-muted)] flex-shrink-0" />;
}

function getPermColor(perm: string) {
  if (perm.includes('x')) return 'text-[var(--accent-green)]';
  if (perm.startsWith('d')) return 'text-[var(--accent-blue)]';
  return 'text-[var(--text-muted)]';
}

export default function SFTPClient() {
  const [path, setPath] = useState('/home/admin');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: SFTPEntry } | null>(null);

  const entries = path === '/' ? ROOT_ENTRIES : HOME_ENTRIES;
  const filtered = entries.filter((e) => {
    if (!showHidden && e.isHidden) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pathParts = path === '/' ? [''] : ['', ...path.slice(1).split('/')];

  const toggleSelect = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const navigate = (entry: SFTPEntry) => {
    if (entry.type === 'directory') {
      setPath(entry.path);
      setSelected(new Set());
      setSearch('');
    }
  };

  const goUp = () => {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    setPath(parts.length ? '/' + parts.join('/') : '/');
    setSelected(new Set());
  };

  const handleContextMenu = (e: React.MouseEvent, entry: SFTPEntry) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  };

  return (
    <div
      className="flex flex-col h-full relative"
      onClick={() => setContextMenu(null)}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={() => setIsDragging(false)}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
        <button className="btn-secondary text-xs py-1 flex items-center gap-1.5" onClick={goUp} disabled={path === '/'}>
          <ArrowUp size={12} />
        </button>
        <button className="btn-secondary text-xs py-1 flex items-center gap-1.5">
          <RefreshCw size={12} />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-0.5 flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs font-mono overflow-x-auto">
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center gap-0.5 flex-shrink-0">
              {i > 0 && <ChevronRight size={10} className="text-[var(--text-muted)]" />}
              <span
                className={`cursor-pointer hover:text-[var(--accent-blue)] transition-colors ${
                  i === pathParts.length - 1 ? 'text-white' : 'text-[var(--text-muted)]'
                }`}
                onClick={() => {
                  const newPath = '/' + pathParts.slice(1, i + 1).join('/');
                  setPath(newPath || '/');
                }}
              >
                {i === 0 ? <Home size={11} /> : part}
              </span>
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="input pl-8 py-1.5 text-xs w-40"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          className={`btn-secondary text-xs py-1 flex items-center gap-1.5 ${showHidden ? 'border-[var(--accent-blue)] text-[var(--accent-blue)]' : ''}`}
          onClick={() => setShowHidden(!showHidden)}
        >
          <Eye size={12} />
          Hidden
        </button>

        <div className="flex items-center gap-1 ml-auto">
          <button className="btn-primary text-xs py-1.5 flex items-center gap-1.5">
            <Upload size={12} />
            Upload
          </button>
          <button className="btn-secondary text-xs py-1.5 flex items-center gap-1.5">
            <FolderPlus size={12} />
            New Folder
          </button>
        </div>
      </div>

      {/* Action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(88,166,255,0.08)] border-b border-[rgba(88,166,255,0.2)] flex-shrink-0">
          <span className="text-xs text-[var(--accent-blue)]">{selected.size} item{selected.size > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-1 ml-auto">
            <button className="btn-secondary text-xs py-1 flex items-center gap-1.5"><Download size={11} />Download</button>
            <button className="btn-secondary text-xs py-1 flex items-center gap-1.5 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)]"><Trash2 size={11} />Delete</button>
          </div>
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        {/* Column headers */}
        <div className="grid text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-4 py-2 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-primary)]"
          style={{ gridTemplateColumns: '1.5rem 1fr 7rem 8rem 8rem 8rem 3rem' }}>
          <span />
          <span>Name</span>
          <span className="text-right">Size</span>
          <span className="text-right">Permissions</span>
          <span>Owner</span>
          <span>Modified</span>
          <span />
        </div>

        {/* Entries */}
        {filtered.map((entry) => (
          <div
            key={entry.name}
            className={`grid items-center px-4 py-2 border-b border-[var(--border-subtle)] cursor-pointer transition-all text-sm ${
              selected.has(entry.name)
                ? 'bg-[rgba(88,166,255,0.1)] border-l-2 border-l-[var(--accent-blue)]'
                : 'hover:bg-[var(--bg-hover)]'
            }`}
            style={{ gridTemplateColumns: '1.5rem 1fr 7rem 8rem 8rem 8rem 3rem' }}
            onClick={() => toggleSelect(entry.name)}
            onDoubleClick={() => navigate(entry)}
            onContextMenu={(e) => handleContextMenu(e, entry)}
          >
            <input
              type="checkbox"
              className="w-3 h-3 accent-blue-500"
              checked={selected.has(entry.name)}
              onChange={() => {}}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center gap-2 min-w-0">
              {getFileIcon(entry)}
              <span className={`truncate ${entry.type === 'directory' ? 'font-medium' : ''} ${entry.isHidden ? 'opacity-50' : ''}`}>
                {entry.name}
              </span>
            </div>
            <span className="text-right text-[var(--text-muted)] text-xs font-mono">{formatFileSize(entry.size)}</span>
            <span className={`text-right text-xs font-mono ${getPermColor(entry.permissions)}`}>{entry.permissions}</span>
            <span className="text-[var(--text-muted)] text-xs">{entry.owner}</span>
            <span className="text-[var(--text-muted)] text-xs">{entry.modified}</span>
            <button
              className="flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); handleContextMenu(e as unknown as React.MouseEvent, entry); }}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] text-[var(--text-muted)] flex-shrink-0">
        <span>{filtered.length} items{selected.size > 0 ? ` · ${selected.size} selected` : ''}</span>
        <span>{path}</span>
        <span>SFTP · admin@192.168.1.100</span>
      </div>

      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[rgba(88,166,255,0.1)] border-2 border-dashed border-[var(--accent-blue)] rounded-lg flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <Upload size={32} className="text-[var(--accent-blue)] mx-auto mb-2" />
            <div className="text-base font-semibold text-[var(--accent-blue)]">Drop files to upload</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Upload to {path}</div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 card shadow-2xl py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { icon: Download, label: 'Download' },
            { icon: Edit2, label: 'Rename' },
            { icon: Plus, label: 'Copy' },
            contextMenu.entry.name.endsWith('.gz') || contextMenu.entry.name.endsWith('.tar')
              ? { icon: Archive, label: 'Extract Here' }
              : null,
            { icon: Eye, label: 'Preview' },
            { icon: Edit2, label: 'Edit Permissions' },
            null,
            { icon: Trash2, label: 'Delete', danger: true },
          ].filter(Boolean).map((item, i) => {
            if (!item) return <div key={i} className="my-1 border-t border-[var(--border)]" />;
            const Icon = item.icon!;
            return (
              <button
                key={item.label}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[var(--bg-hover)] transition-colors ${
                  (item as {danger?: boolean}).danger ? 'text-[var(--accent-red)]' : 'text-[var(--text-secondary)]'
                }`}
                onClick={() => setContextMenu(null)}
              >
                <Icon size={12} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
