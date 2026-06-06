import { useState, useEffect, useRef } from 'react';
import {
  Folder, FileText, Upload, Download, Trash2, Edit2, Plus,
  RefreshCw, ChevronRight, Home, Search,
  Archive, Eye, MoreHorizontal, FolderPlus, ArrowUp, Loader2,
} from 'lucide-react';
import { apiRequest, apiRequestRaw } from '../../api/client';

interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  mode: string;
  modTime: number;
}

function toSFTPType(e: FileEntry): 'file' | 'directory' {
  return e.isDir ? 'directory' : 'file';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function getFileIcon(entry: FileEntry) {
  if (entry.isDir) return <Folder size={16} className="text-[var(--accent-blue)] flex-shrink-0" />;
  const ext = entry.name.split('.').pop()?.toLowerCase();
  if (['gz', 'tar', 'zip', 'bz2'].includes(ext ?? '')) return <Archive size={16} className="text-[var(--accent-yellow)] flex-shrink-0" />;
  return <FileText size={16} className="text-[var(--text-muted)] flex-shrink-0" />;
}

function getPermColor(mode: string) {
  if (mode.includes('x')) return 'text-[var(--accent-green)]';
  if (mode.startsWith('d')) return 'text-[var(--accent-blue)]';
  return 'text-[var(--text-muted)]';
}

export default function SFTPClient() {
  const [path, setPath] = useState('/');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [search, setSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FileEntry } | null>(null);
  const [previewEntry, setPreviewEntry] = useState<FileEntry | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDirectory = async (dir: string) => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      const data = await apiRequest<FileEntry[]>(`/api/files?path=${encodeURIComponent(dir)}`);
      setEntries(data ?? []);
      setPath(dir);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDirectory('/'); }, []);

  const filtered = entries.filter((e) => {
    if (!showHidden && e.name.startsWith('.')) return false;
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

  const navigate = (entry: FileEntry) => {
    if (entry.isDir) loadDirectory(entry.path);
  };

  const goUp = () => {
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    loadDirectory(parts.length ? '/' + parts.join('/') : '/');
  };

  const handleContextMenu = (e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  };

  const handleDelete = async (entryPath: string) => {
    setContextMenu(null);
    setError(null);
    try {
      await apiRequest(`/api/files/delete?path=${encodeURIComponent(entryPath)}`, { method: 'DELETE' });
      loadDirectory(path);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDeleteSelected = async () => {
    setError(null);
    for (const name of selected) {
      const entry = entries.find((e) => e.name === name);
      if (entry) {
        try {
          await apiRequest(`/api/files/delete?path=${encodeURIComponent(entry.path)}`, { method: 'DELETE' });
        } catch { /* continue with others */ }
      }
    }
    loadDirectory(path);
  };

  const handleNewFolder = async () => {
    const name = prompt('Folder name:');
    if (!name) return;
    setError(null);
    try {
      await apiRequest(`/api/files/mkdir?path=${encodeURIComponent(path + '/' + name)}`, { method: 'POST' });
      loadDirectory(path);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const token = (window as any).__store_token__ ?? '';
    Array.from(files).forEach(async (file) => {
      const form = new FormData();
      form.append('file', file);
      try {
        const res = await apiRequestRaw(
          `/api/files/upload?path=${encodeURIComponent(path)}`,
          { method: 'POST', body: form },
        );
        if (!res.ok) throw new Error(await res.text());
        loadDirectory(path);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  };

  const handlePreview = async (entry: FileEntry) => {
    setContextMenu(null);
    if (entry.isDir) return;
    setPreviewEntry(entry);
    setPreviewContent(null);
    try {
      const res = await apiRequestRaw(`/api/files/read?path=${encodeURIComponent(entry.path)}`);
      if (!res.ok) throw new Error(await res.text());
      setPreviewContent(await res.text());
    } catch (e) {
      setPreviewContent(`Error: ${(e as Error).message}`);
    }
  };

  return (
    <div
      className="flex flex-col h-full relative"
      onClick={() => setContextMenu(null)}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex-shrink-0">
        <button className="btn-secondary text-xs py-1 flex items-center gap-1.5" onClick={goUp} disabled={path === '/'}>
          <ArrowUp size={12} />
        </button>
        <button className="btn-secondary text-xs py-1 flex items-center gap-1.5" onClick={() => loadDirectory(path)}>
          <RefreshCw size={12} />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-0.5 flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs font-mono overflow-x-auto">
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center gap-0.5 flex-shrink-0">
              {i > 0 && <ChevronRight size={10} className="text-[var(--text-muted)]" />}
              <span
                className={`cursor-pointer hover:text-[var(--accent-blue)] transition-colors ${i === pathParts.length - 1 ? 'text-white' : 'text-[var(--text-muted)]'}`}
                onClick={() => {
                  const newPath = '/' + pathParts.slice(1, i + 1).join('/');
                  loadDirectory(newPath || '/');
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
          <button className="btn-primary text-xs py-1.5 flex items-center gap-1.5" onClick={() => fileInputRef.current?.click()}>
            <Upload size={12} />
            Upload
          </button>
          <button className="btn-secondary text-xs py-1.5 flex items-center gap-1.5" onClick={handleNewFolder}>
            <FolderPlus size={12} />
            New Folder
          </button>
        </div>
      </div>

      {/* Error bar */}
      {error && (
        <div className="px-4 py-1.5 text-xs text-[var(--accent-red)] bg-[rgba(248,81,73,0.08)] border-b border-[rgba(248,81,73,0.2)] flex-shrink-0">
          {error}
        </div>
      )}

      {/* Action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(88,166,255,0.08)] border-b border-[rgba(88,166,255,0.2)] flex-shrink-0">
          <span className="text-xs text-[var(--accent-blue)]">{selected.size} item{selected.size > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-1 ml-auto">
            <button className="btn-secondary text-xs py-1 flex items-center gap-1.5 hover:border-[var(--accent-red)] hover:text-[var(--accent-red)]" onClick={handleDeleteSelected}>
              <Trash2 size={11} />Delete
            </button>
          </div>
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] px-4 py-2 border-b border-[var(--border-subtle)] sticky top-0 bg-[var(--bg-primary)]"
          style={{ gridTemplateColumns: '1.5rem 1fr 7rem 8rem 8rem 3rem' }}>
          <span /><span>Name</span><span className="text-right">Size</span><span className="text-right">Mode</span><span>Modified</span><span />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
            <Loader2 size={20} className="animate-spin" />
          </div>
        )}

        {!loading && filtered.map((entry) => (
          <div
            key={entry.name}
            className={`grid items-center px-4 py-2 border-b border-[var(--border-subtle)] cursor-pointer transition-all text-sm ${
              selected.has(entry.name)
                ? 'bg-[rgba(88,166,255,0.1)] border-l-2 border-l-[var(--accent-blue)]'
                : 'hover:bg-[var(--bg-hover)]'
            }`}
            style={{ gridTemplateColumns: '1.5rem 1fr 7rem 8rem 8rem 3rem' }}
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
              <span className={`truncate ${entry.isDir ? 'font-medium' : ''} ${entry.name.startsWith('.') ? 'opacity-50' : ''}`}>
                {entry.name}
              </span>
            </div>
            <span className="text-right text-[var(--text-muted)] text-xs font-mono">{formatFileSize(entry.size)}</span>
            <span className={`text-right text-xs font-mono ${getPermColor(entry.mode)}`}>{entry.mode}</span>
            <span className="text-[var(--text-muted)] text-xs">
              {new Date(entry.modTime * 1000).toLocaleDateString()}
            </span>
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
        <span>Files</span>
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
            !contextMenu.entry.isDir ? { icon: Eye, label: 'Preview', action: () => handlePreview(contextMenu.entry) } : null,
            { icon: Trash2, label: 'Delete', danger: true, action: () => handleDelete(contextMenu.entry.path) },
          ].filter(Boolean).map((item, i) => {
            if (!item) return <div key={i} className="my-1 border-t border-[var(--border)]" />;
            const Icon = item.icon!;
            return (
              <button
                key={item.label}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-[var(--bg-hover)] transition-colors ${
                  (item as { danger?: boolean }).danger ? 'text-[var(--accent-red)]' : 'text-[var(--text-secondary)]'
                }`}
                onClick={item.action}
              >
                <Icon size={12} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {previewEntry && (
        <div className="modal-overlay animate-fade-in" onClick={() => setPreviewEntry(null)}>
          <div className="modal w-[700px] max-w-[95vw] animate-slide-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <div className="font-semibold text-sm">{previewEntry.name}</div>
              <button className="text-[var(--text-muted)] hover:text-white" onClick={() => setPreviewEntry(null)}>✕</button>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-xs bg-[var(--bg-tertiary)]" style={{ height: '60vh', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {previewContent === null
                ? <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" />
                : <span className="text-[var(--text-secondary)]">{previewContent}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
