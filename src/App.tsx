import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Reader from './pages/Reader';
import { AppState, Note, User } from './types';
import { WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { Profile } from './pages/Profile';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('focus_reader_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        currentPdf: null, // Files can't be serialized
        folders: parsed.folders || [],
        recentFiles: parsed.recentFiles || []
      };
    }
    return {
      view: 'landing',
      user: null,
      currentPdf: null,
      notes: [],
      folders: [],
      recentFiles: []
    };
  });


  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineBanner(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const { currentPdf, ...rest } = state;
    localStorage.setItem('focus_reader_state', JSON.stringify(rest));
  }, [state]);

      const handleLogout = () => {
        setState(prev => ({ ...prev, user: null }));
        navigate('/');
      };

const [fileCache, setFileCache] = useState<Record<string, File>>({});
const handleFileSelect = (file: File) => {
  const id = Date.now().toString();
  setFileCache(prev => ({ ...prev, [id]: file }));
  setState(prev => ({
    ...prev,
    currentPdf: file,
    recentFiles: [{ id, name: file.name, size: file.size, timestamp: Date.now() }, ...prev.recentFiles]
  }));
  navigate('/reader');
};

  const handleOpenRecent = (fileId: string) => {
    const isUrl = fileId.startsWith('http');
    const file = isUrl ? fileId : fileCache[fileId];
    
    if (file) {
      setState(prev => ({ ...prev, currentPdf: file }));
      navigate('/reader');
    } else {
      alert('File not found in current session. Please re-upload.');
    }
  };

  const handleDeleteRecent = (id: string) => {
    setState(prev => ({
      ...prev,
      recentFiles: prev.recentFiles.filter(f => f.id !== id)
    }));
    setFileCache(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSaveNote = (note: Note) => {
    setState(prev => ({ ...prev, notes: [note, ...prev.notes] }));
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(n => n.id === updatedNote.id ? updatedNote : n)
    }));
  };

  const handleDeleteNote = (id: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== id)
    }));
  };

  const handleCreateFolder = (name: string) => {
    const newFolder = {
      id: Date.now().toString(),
      name,
      timestamp: Date.now()
    };
    setState(prev => ({ ...prev, folders: [newFolder, ...prev.folders] }));
  };

  const handleDeleteFolder = (id: string) => {
    setState(prev => ({
      ...prev,
      folders: prev.folders.filter(f => f.id !== id),
      notes: prev.notes.map(n => n.folderId === id ? { ...n, folderId: undefined } : n)
    }));
  };

  return (
    <div className="min-h-screen">
      <Toaster />
      <AnimatePresence>
        {showOfflineBanner && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 z-[1000] bg-neutral-900 text-white p-4 flex items-center justify-between shadow-2xl border-b border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400">
                <WifiOff size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Offline Mode Active</h4>
                <p className="text-xs text-white/60">You can still read your PDFs and take notes. AI features will resume when you're back online.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowOfflineBanner(false)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <Routes>
        <Route path="/" element={<LandingPage onStart={() => navigate('/dashboard')} />} />
        <Route path="/dashboard" element={<Dashboard  /> }/>
        <Route path="/reader/:pdfId" element={<Reader />} />
        
      </Routes>
    </div>
  );
}
