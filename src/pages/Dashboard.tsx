import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, Folder, FolderPlus, Plus, Search, Trash2,
  StickyNote, Edit2, Check, X, Globe, Upload, ChevronRight,
  BookOpen, LogOut, Clock, Link2, MoreVertical, FolderOpen, User
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { showToast } from '../utils/toast';
import { DashboardApi } from '../apis/dashboard.api';
import { set, get } from 'idb-keyval';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { AuthApiService } from '../apis/auth.service';
import PdfCard from '../components/PdfCard';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Note {
  id: string; text: string; explanation?: string;
  pageNumber: number; folderId?: string; highlight?: string; timestamp: number;
}
interface FolderType { _id: string; name: string; }
interface RecentFile {
  _id: string; name: string; size: number; createdAt: Date;
  isUrl?: boolean; fileId?: string; file_path?: string;
}

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
function uid() { return Math.random().toString(36).slice(2, 10); }

const NOTE_COLORS = [
  { v: undefined, dot: '#D1D5DB' },
  { v: '#FEE2E2', dot: '#F87171' },
  { v: '#FEF3C7', dot: '#FBBF24' },
  { v: '#D1FAE5', dot: '#34D399' },
  { v: '#DBEAFE', dot: '#60A5FA' },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const user = useSelector((state: RootState) => state.auth.userData)
  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'there';
  const navigate = useNavigate();

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [activeView, setActiveView] = useState<'recent' | 'notes'>('recent');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isUrlLoading, setIsUrlLoading] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ text: '', explanation: '' });
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // ── Data ───────────────────────────────────────────────────────────────────
  async function loadRecentFiles() {
    try {
      const r: any = await DashboardApi.getInstance().getRecentFiles();
      if (r.statusCode === 200) setRecentFiles(r.data);
      else showToast('Failed to load recent files', 'error');
    } catch { showToast('Error fetching recent files', 'error'); }
  }
  useEffect(() => { loadRecentFiles(); }, []);
  useEffect(() => {
    if (isCreatingFolder) setTimeout(() => folderInputRef.current?.focus(), 50);
  }, [isCreatingFolder]);

  // ── File handlers ──────────────────────────────────────────────────────────
  const handleFileSelect = async () => {
    if (isFileLoading) return;
    setIsFileLoading(true);
    try {
      const [fh] = await window.showOpenFilePicker({
        types: [{ description: 'PDF Files', accept: { 'application/pdf': ['.pdf'] } }],
      });
      const file = await fh.getFile();
      const fileId = `${file.name}-${file.size}`;
      await set(fileId, fh);
      const r = await DashboardApi.getInstance().handleOpenNewFile({
        name: file.name, size: file.size, isUrl: false, fileId, file_path: file.name,
      });
      if (r.statusCode === 201) { navigate(`/reader/${r.data._id}`); }
      else showToast('Failed to save file', 'error');
    } catch (e: any) {
      if (e?.name !== 'AbortError') showToast('File selection failed', 'error');
    } finally { setIsFileLoading(false); }
  };

  const handleOpenRecent = async (file: RecentFile) => {
    if (file.isUrl) { navigate(`/reader/${file._id}`); return; }
    try {
      const handle = await get(file.fileId as string);
      if (!handle) { showToast('File not found — please reselect', 'error'); return; }
      const perm = await handle.queryPermission({ mode: 'read' });
      if (perm !== 'granted') {
        const np = await handle.requestPermission({ mode: 'read' });
        if (np !== 'granted') { showToast('Permission denied', 'error'); return; }
      }
      navigate(`/reader/${file._id}`);
    } catch { showToast('File may have been moved or deleted', 'error'); }
  };

  const handleDeleteRecent = async (id: string) => {
    try {
      const r = await DashboardApi.getInstance().deleteRecentFile(id);
      if (r.statusCode === 200) { loadRecentFiles(); showToast('Removed', 'success'); }
      else showToast('Failed to remove', 'error');
    } catch { showToast('Failed to remove', 'error'); }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { showToast('Please drop a PDF file', 'error'); return; }
    const fileId = `${file.name}-${file.size}`;
    try {
      const r = await DashboardApi.getInstance().handleOpenNewFile({
        name: file.name, size: file.size, isUrl: false, fileId, file_path: file.name,
      });
      if (r.statusCode === 201) navigate(`/reader/${r.data._id}`);
      else showToast('Failed to open file', 'error');
    } catch { showToast('Failed to open file', 'error'); }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!pdfUrl.trim()) return;
    setIsUrlLoading(true);
    try {
      if (!pdfUrl.startsWith('http://') && !pdfUrl.startsWith('https://'))
        throw new Error('URL must start with http:// or https://');
      const r = await DashboardApi.getInstance().handleOpenNewFile({
        name: pdfUrl.split('/').pop() || 'Remote PDF',
        size: 0, isUrl: true, fileId: pdfUrl, file_path: pdfUrl,
      });
      if (r.statusCode === 201) { setPdfUrl(''); navigate(`/reader/${r.data._id}`); }
      else showToast('Failed to save URL', 'error');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load URL', 'error');
    } finally { setIsUrlLoading(false); }
  };

  // ── Notes ──────────────────────────────────────────────────────────────────
  const handleUpdateNote = (n: Note) => setNotes(p => p.map(x => x.id === n.id ? n : x));
  const handleDeleteNote = (id: string) => {
    setNotes(p => p.filter(n => n.id !== id));
    showToast('Note deleted', 'success');
  };
  const saveEdit = (note: Note) => {
    handleUpdateNote({ ...note, text: editValues.text, explanation: editValues.explanation });
    setEditingNoteId(null);
    showToast('Note updated', 'success');
  };

  // ── Folders ────────────────────────────────────────────────────────────────
  const handleCreateFolder = async () => {
    try {
      const response = await DashboardApi.getInstance().createFolder({ name: newFolderName });
      if (response.statusCode === 201) {
        setNewFolderName('');
        setIsCreatingFolder(false);
        loadFolders()
        showToast('Folder created', 'success');

      } else {
        showToast('Failed to create folder', 'error');
      }
    } catch (error) {
      showToast('Failed to create folder', 'error');
    }
  };
  const handleDeleteFolder = async (id: string) => {
    try {
      const response = await DashboardApi.getInstance().deleteFolder(id);
      if (response.statusCode === 200) {
        loadFolders();
        showToast('Folder deleted', 'success');
      } else {
        showToast('Failed to delete folder', 'error');
      }
    } catch (error) {
      showToast('Failed to delete folder', 'error');
    }
  };

  const filteredNotes = notes.filter(n => {
    const q = searchQuery.toLowerCase();
    return (n.text.toLowerCase().includes(q) || (n.explanation?.toLowerCase().includes(q) ?? false))
      && (selectedFolderId ? n.folderId === selectedFolderId : true);
  });

  async function loadFolders() {
    try {
      const r = await DashboardApi.getInstance().getFolders();
      if (r.statusCode === 200) setFolders(r.data);
      else showToast('Failed to load folders', 'error');
    } catch { showToast('Error fetching folders', 'error'); }
  }
  useEffect(() => { loadFolders(); }, []);

  const handleLogout = async () => {
    try {
      await AuthApiService.getInstance().logout();
      window.location.href = "/";
    } catch {
      showToast('Logout failed', 'error');
    }
  };


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');
        :root {
          --bg: #0C0C0E;
          --surface: #141416;
          --surface2: #1A1A1E;
          --border: #252528;
          --border2: #2E2E33;
          --text: #F2F2F3;
          --text2: #8A8A94;
          --text3: #5A5A63;
          --accent: #E8C77A;
          --accent-dim: #3D3420;
          --danger: #F87171;
          --success: #4ADE80;
        }
        * { box-sizing: border-box; }
        body { background: var(--bg); }
        .f-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .f-sans  { font-family: 'Geist', system-ui, sans-serif; }
        .sb::-webkit-scrollbar { width: 3px; }
        .sb::-webkit-scrollbar-track { background: transparent; }
        .sb::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
        .inset-ring { box-shadow: inset 0 0 0 1px var(--border); }
        .card-hover { transition: background 0.15s, box-shadow 0.15s, transform 0.15s; }
        .card-hover:hover { background: var(--surface2); transform: translateY(-1px); box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
        .btn-primary {
          background: var(--accent); color: #0C0C0E; font-weight: 600;
          border-radius: 8px; transition: opacity 0.15s, transform 0.1s;
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .btn-ghost {
          background: transparent; color: var(--text2); border-radius: 7px;
          transition: background 0.12s, color 0.12s;
        }
        .btn-ghost:hover { background: var(--surface2); color: var(--text); }
        .input-base {
          background: var(--surface); border: 1px solid var(--border2);
          color: var(--text); border-radius: 8px; font-family: 'Geist', system-ui, sans-serif;
          transition: border-color 0.15s;
        }
        .input-base::placeholder { color: var(--text3); }
        .input-base:focus { outline: none; border-color: var(--accent); }
        .sidebar-item {
          display: flex; align-items: center; gap: 8px; padding: 6px 10px;
          border-radius: 7px; cursor: pointer; transition: background 0.12s, color 0.12s;
          font-size: 13px; font-weight: 500; color: var(--text2); width: 100%;
          border: none; background: transparent; text-align: left;
        }
        .sidebar-item:hover { background: var(--surface2); color: var(--text); }
        .sidebar-item.active { background: var(--accent-dim); color: var(--accent); }
        .tag { display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 4px;
          font-size: 10px; font-weight: 600; letter-spacing: 0.04em; }
        .divider { height: 1px; background: var(--border); margin: 6px 0; }
      `}</style>

      <div className="f-sans flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg)', color: 'var(--text)' }}>

        {/* ── Top nav ─────────────────────────────────────────────────────── */}
        <header className="shrink-0 flex items-center justify-between px-5 h-12 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <BookOpen size={12} style={{ color: '#0C0C0E' }} />
            </div>
            <span className="f-serif text-base" style={{ color: 'var(--text)' }}>FocusReader</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <FileText size={11} style={{ color: 'var(--text3)' }} />
              <span className="text-xs" style={{ color: 'var(--text2)' }}>{recentFiles.length} files</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <StickyNote size={11} style={{ color: 'var(--text3)' }} />
              <span className="text-xs" style={{ color: 'var(--text2)' }}>{notes.length} notes</span>
            </div>
            <div className="w-px h-4 mx-1" style={{ background: 'var(--border2)' }} />
            <button onClick={() => navigate('/profile')} className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
              <User size={12} />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button onClick={handleLogout} className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300">
              <LogOut size={12} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* ── Body: sidebar + main ─────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0">

          {/* Left sidebar */}
          <aside className="hidden md:flex flex-col w-52 shrink-0 border-r py-3 px-2 sb overflow-y-auto"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

            {/* Welcome */}
            <div className="px-2 mb-4">
              <p className="text-xs mb-0.5" style={{ color: 'var(--text3)' }}>Signed in as</p>
              <p className="f-serif text-base leading-tight" style={{ color: 'var(--text)' }}>{firstName}</p>
            </div>
            <div className="divider" />

            {/* Views */}
            <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1.5" style={{ color: 'var(--text3)' }}>Library</p>
            <button className={cn('sidebar-item', activeView === 'recent' && 'active')}
              onClick={() => setActiveView('recent')}>
              <Clock size={13} />
              Recent files
              <span className="ml-auto tag" style={{ background: 'var(--border)', color: 'var(--text2)' }}>{recentFiles.length}</span>
            </button>
            <button className={cn('sidebar-item', activeView === 'notes' && 'active')}
              onClick={() => setActiveView('notes')}>
              <StickyNote size={13} />
              My notes
              <span className="ml-auto tag" style={{ background: 'var(--border)', color: 'var(--text2)' }}>{notes.length}</span>
            </button>

            {/* Folders — only shown in notes view */}
            {activeView === 'notes' && (
              <>
                <div className="divider mt-2" />
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Folders</p>
                  <button
                    onClick={() => setIsCreatingFolder(v => !v)}
                    className="btn-ghost p-1 rounded-md"
                    title="New folder"
                  >
                    <FolderPlus size={12} />
                  </button>
                </div>

                {/* New folder input */}
                <AnimatePresence>
                  {isCreatingFolder && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-1"
                    >
                      <div className="flex items-center gap-1 px-1 pb-1">
                        <input
                          ref={folderInputRef}
                          type="text"
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleCreateFolder();
                            if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName(''); }
                          }}
                          placeholder="Folder name"
                          className="input-base flex-1 text-xs px-2 py-1.5"
                        />
                        <button onClick={handleCreateFolder}
                          className="btn-primary p-1.5 rounded-md shrink-0">
                          <Check size={11} />
                        </button>
                        <button onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}
                          className="btn-ghost p-1.5 rounded-md shrink-0">
                          <X size={11} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button className={cn('sidebar-item', selectedFolderId === null && activeView === 'notes' && 'active')}
                  onClick={() => setSelectedFolderId(null)}>
                  <FolderOpen size={13} />
                  All notes
                  <span className="ml-auto tag" style={{ background: 'var(--border)', color: 'var(--text2)' }}>{notes.length}</span>
                </button>

                {folders.map(f => (
                  <div key={f._id} className="group relative">
                    <button className={cn('sidebar-item w-full', selectedFolderId === f._id && 'active')}
                      onClick={() => setSelectedFolderId(f._id)}>
                      <Folder size={13} />
                      <span className="flex-1 truncate">{f.name}</span>
                      <span className="tag" style={{ background: 'var(--border)', color: 'var(--text2)' }}>
                        {notes.filter(n => n.folderId === f._id).length}
                      </span>
                    </button>
                    <button onClick={() => handleDeleteFolder(f._id)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--danger)' }}>
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </aside>

          {/* Main content */}
          <main className="flex-1 flex flex-col min-h-0 min-w-0">

            {/* Content header bar */}
            <div className="shrink-0 flex items-center gap-3 px-5 h-11 border-b"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>

              {/* Mobile tab pills */}
              <div className="flex items-center gap-1 md:hidden">
                {(['recent', 'notes'] as const).map(v => (
                  <button key={v} onClick={() => setActiveView(v)}
                    className={cn('text-xs px-3 py-1 rounded-md font-medium transition-all',
                      activeView === v ? 'btn-primary' : 'btn-ghost')}>
                    {v === 'recent' ? 'Recent' : 'Notes'}
                  </button>
                ))}
              </div>

              <span className="hidden md:block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {activeView === 'recent' ? 'Recent Files' : selectedFolderId ? folders.find(f => f._id === selectedFolderId)?.name ?? 'Notes' : 'All Notes'}
              </span>

              <div className="ml-auto flex items-center gap-2">
                {activeView === 'notes' && (
                  <>
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
                      <input type="text" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search notes…"
                        className="input-base text-xs pl-7 pr-3 py-1.5 w-40"
                      />
                    </div>
                    {/* Mobile new folder button */}
                    <button onClick={() => setIsCreatingFolder(v => !v)}
                      className="md:hidden btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs">
                      <FolderPlus size={12} /> Folder
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Scrollable area */}
            <div className="flex-1 overflow-y-auto sb p-5">
              <AnimatePresence mode="wait">

                {/* ── RECENT FILES ── */}
                {activeView === 'recent' && (
                  <motion.div key="recent"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Upload zone */}
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={cn(
                        'rounded-xl border-2 border-dashed p-6 mb-5 transition-all duration-200',
                        isDragging ? 'border-amber-400 bg-amber-400/5' : ''
                      )}
                      style={!isDragging ? { borderColor: 'var(--border2)', background: 'var(--surface)' } : {}}
                    >
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Upload button */}
                        <button onClick={handleFileSelect} disabled={isFileLoading}
                          className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm shrink-0 disabled:opacity-50">
                          <Upload size={14} />
                          {isFileLoading ? 'Opening…' : 'Open PDF'}
                        </button>

                        <div className="flex items-center gap-3 text-xs shrink-0" style={{ color: 'var(--text3)' }}>
                          <div className="w-px h-8 hidden sm:block" style={{ background: 'var(--border2)' }} />
                          <span>or drop a file here</span>
                          <div className="w-px h-8 hidden sm:block" style={{ background: 'var(--border2)' }} />
                        </div>

                        {/* URL form */}
                        <form onSubmit={handleUrlSubmit} className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="relative flex-1 min-w-0">
                            <Link2 size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
                            <input type="text" value={pdfUrl}
                              onChange={e => setPdfUrl(e.target.value)}
                              placeholder="Paste PDF URL…"
                              className="input-base text-xs pl-7 pr-3 py-2.5 w-full"
                            />
                          </div>
                          <button type="submit" disabled={isUrlLoading || !pdfUrl.trim()}
                            className="btn-primary px-3 py-2.5 text-xs shrink-0 disabled:opacity-40">
                            {isUrlLoading ? '…' : 'Open'}
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Files list */}
                    {recentFiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                          style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
                          <Clock size={18} />
                        </div>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>No recent files</p>
                        <p className="text-xs" style={{ color: 'var(--text3)' }}>Open a PDF to start reading</p>
                      </div>
                    ) : (
                      <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                        {/* Table header */}
                        <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-2 border-b"
                          style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>
                          <span />
                          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Name</span>
                          <span className="text-[10px] font-semibold uppercase tracking-widest hidden sm:block" style={{ color: 'var(--text3)' }}>Size</span>
                          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Date</span>
                        </div>
                        {recentFiles.map((file, i) => {
                          return (
                            <PdfCard
                              key={i}
                              file={file}
                              
                              handleDeleteRecent={handleDeleteRecent}
                              handleOpenRecent={handleOpenRecent}
                            />
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── NOTES ── */}
                {activeView === 'notes' && (
                  <motion.div key="notes"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Mobile folder creator */}
                    <AnimatePresence>
                      {isCreatingFolder && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mb-3 md:hidden">
                          <div className="flex items-center gap-2 p-3 rounded-xl border"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <input ref={folderInputRef} type="text" value={newFolderName}
                              onChange={e => setNewFolderName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleCreateFolder();
                                if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName(''); }
                              }}
                              placeholder="Folder name"
                              className="input-base flex-1 text-sm px-3 py-2"
                            />
                            <button onClick={handleCreateFolder} className="btn-primary px-3 py-2 text-sm">Create</button>
                            <button onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}
                              className="btn-ghost p-2"><X size={14} /></button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {filteredNotes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                          style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
                          <StickyNote size={18} />
                        </div>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text2)' }}>No notes yet</p>
                        <p className="text-xs" style={{ color: 'var(--text3)' }}>Select text while reading to create AI notes</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {filteredNotes.map((note, i) => {
                          const col = NOTE_COLORS.find(c => c.v === note.highlight) ?? NOTE_COLORS[0];
                          return (
                            <motion.div key={note.id}
                              layout
                              initial={{ opacity: 0, scale: 0.97 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.03 }}
                              className="group relative flex flex-col rounded-xl border overflow-hidden transition-all duration-150 hover:-translate-y-0.5"
                              style={{
                                background: note.highlight ?? 'var(--surface)',
                                borderColor: note.highlight ? 'transparent' : 'var(--border)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                              }}
                            >
                              {/* Note header */}
                              <div className="flex items-center justify-between px-3.5 py-2.5 border-b"
                                style={{ borderColor: note.highlight ? 'rgba(0,0,0,0.08)' : 'var(--border)', background: note.highlight ? 'rgba(0,0,0,0.04)' : 'var(--surface2)' }}>
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: col.dot }} />
                                  <span className="text-[10px] font-bold uppercase tracking-widest"
                                    style={{ color: note.highlight ? 'rgba(0,0,0,0.4)' : 'var(--text3)' }}>
                                    p.{note.pageNumber}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {NOTE_COLORS.map(c => (
                                    <button key={c.dot} onClick={() => handleUpdateNote({ ...note, highlight: c.v })}
                                      className={cn('w-3 h-3 rounded-full transition-transform hover:scale-125', note.highlight === c.v && 'ring-1 ring-offset-1 ring-black/30')}
                                      style={{ background: c.dot }} />
                                  ))}
                                  <div className="w-px h-3 mx-1" style={{ background: 'rgba(0,0,0,0.15)' }} />
                                  {editingNoteId === note.id ? (
                                    <>
                                      <button onClick={() => saveEdit(note)}
                                        className="p-1 rounded-md transition-colors hover:bg-black/10">
                                        <Check size={11} style={{ color: '#16a34a' }} />
                                      </button>
                                      <button onClick={() => setEditingNoteId(null)}
                                        className="p-1 rounded-md hover:bg-black/10">
                                        <X size={11} style={{ color: note.highlight ? '#666' : 'var(--text2)' }} />
                                      </button>
                                    </>
                                  ) : (
                                    <button onClick={() => { setEditingNoteId(note.id); setEditValues({ text: note.text, explanation: note.explanation ?? '' }); }}
                                      className="p-1 rounded-md hover:bg-black/10">
                                      <Edit2 size={11} style={{ color: note.highlight ? '#666' : 'var(--text3)' }} />
                                    </button>
                                  )}
                                  <button onClick={() => handleDeleteNote(note.id)}
                                    className="p-1 rounded-md hover:bg-red-500/10">
                                    <Trash2 size={11} style={{ color: '#f87171' }} />
                                  </button>
                                </div>
                              </div>

                              {/* Note body */}
                              <div className="px-3.5 py-3 flex-1">
                                {editingNoteId === note.id ? (
                                  <div className="space-y-2">
                                    <textarea value={editValues.text}
                                      onChange={e => setEditValues(p => ({ ...p, text: e.target.value }))}
                                      className="w-full p-2 rounded-lg text-xs italic resize-none min-h-[50px] focus:outline-none"
                                      style={{ background: 'rgba(0,0,0,0.06)', color: note.highlight ? '#333' : 'var(--text2)', border: '1px solid rgba(0,0,0,0.1)' }}
                                    />
                                    <textarea value={editValues.explanation}
                                      onChange={e => setEditValues(p => ({ ...p, explanation: e.target.value }))}
                                      className="w-full p-2 rounded-lg text-xs resize-none min-h-[70px] focus:outline-none"
                                      style={{ background: 'rgba(0,0,0,0.06)', color: note.highlight ? '#333' : 'var(--text)', border: '1px solid rgba(0,0,0,0.1)' }}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-xs italic leading-relaxed mb-2 line-clamp-2"
                                      style={{ color: note.highlight ? 'rgba(0,0,0,0.5)' : 'var(--text3)' }}>
                                      &ldquo;{note.text}&rdquo;
                                    </p>
                                    {note.explanation && (
                                      <p className="text-xs leading-relaxed line-clamp-3"
                                        style={{ color: note.highlight ? 'rgba(0,0,0,0.75)' : 'var(--text2)' }}>
                                        {note.explanation}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Note footer */}
                              <div className="flex items-center justify-between px-3.5 py-2 border-t"
                                style={{ borderColor: note.highlight ? 'rgba(0,0,0,0.07)' : 'var(--border)' }}>
                                <span className="text-[10px]" style={{ color: note.highlight ? 'rgba(0,0,0,0.35)' : 'var(--text3)' }}>
                                  {new Date(note.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <ChevronRight size={11} style={{ color: note.highlight ? 'rgba(0,0,0,0.25)' : 'var(--text3)' }} />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div >
      </div >
    </>
  );
}