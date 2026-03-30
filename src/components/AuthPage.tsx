import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Lock, ShieldCheck } from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
  onLogin: (user: { name: string; email: string }) => void;
}

export default function AuthPage({ onBack, onLogin }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      onLogin({
        name: email.split('@')[0] || 'Guest User',
        email: email
      });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <div className="p-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-neutral-200 p-12"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-6">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h2>
            <p className="text-neutral-500">Sign in to access your library and notes.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-neutral-100">
            <button 
              onClick={() => onLogin({ name: 'Google User', email: 'google@gmail.com' })}
              className="w-full py-4 bg-white border border-neutral-200 text-neutral-900 rounded-2xl font-bold hover:bg-neutral-50 transition-all flex items-center justify-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
