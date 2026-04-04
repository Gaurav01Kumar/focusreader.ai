import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Reader from './pages/Reader';

import { LucideRoute, WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { Profile } from './pages/Profile';
import { AuthLayout } from './layout/AuthLayout';
import FileAnalytics from './pages/Anlytics';

export default function App() {



  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const navigate = useNavigate();


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
        <Route path="/" element={
          <AuthLayout>
            <LandingPage onStart={() => navigate('/dashboard')} />
          </AuthLayout>
        } />
        <Route path="/dashboard" element={
          <AuthLayout>
            <Dashboard />
          </AuthLayout>
        } />
        <Route path="/reader/:pdfId" element={
          <AuthLayout>
            <Reader />
          </AuthLayout>
        } />
        <Route path="/insights/:pdfId"
          element={
            <AuthLayout>
              <FileAnalytics />
            </AuthLayout>
          } 
          />

      </Routes>
    </div>
  );
}
