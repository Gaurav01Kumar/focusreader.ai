import { AnimatePresence, motion } from 'motion/react';
import React from 'react';
import { BarChart2, X, Clock, FileText, TrendingUp, AlertTriangle } from 'lucide-react';

interface AnalyticsProps {
  showAnalytics: boolean;
  setShowAnalytics: (show: boolean) => void;
  timeSpent: number;
  pagesRead: Set<number>;
  numPages: number | null;
  distractionCount: number;
  formatTime: (seconds: number) => string;
  calculateFocusScore: () => number;
}

const Anytics = ({
  showAnalytics,
  setShowAnalytics,
  timeSpent,
  pagesRead,
  numPages,
  distractionCount,
  formatTime,
  calculateFocusScore
}: AnalyticsProps) => {
  return (
      <AnimatePresence>
        {showAnalytics && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnalytics(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200"
            >
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <BarChart2 className="text-emerald-500" />
                  Reading Analytics
                </h3>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                      <Clock size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Time Spent</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-900">
                      {formatTime(timeSpent)}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <FileText size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Pages Read</span>
                    </div>
                    <div className="text-2xl font-black text-blue-900">
                      {pagesRead.size} <span className="text-sm font-medium opacity-50">/ {numPages}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-neutral-900 rounded-2xl text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-amber-400">
                        <TrendingUp size={18} />
                        <span className="text-xs font-bold uppercase tracking-wider">Focus Score</span>
                      </div>
                      <div className="text-3xl font-black">{calculateFocusScore()}%</div>
                    </div>

                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateFocusScore()}%` }}
                        className="h-full bg-amber-400"
                      />
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-white/60">
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={12} className="text-red-400" />
                        {distractionCount} Distractions
                      </div>
                    </div>
                  </div>

                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
                </div>

                <div className="text-center">
                  <p className="text-sm text-neutral-500 italic">
                    "The more that you read, the more things you will know."
                  </p>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 border-t border-neutral-100">
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="w-full py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                >
                  Keep Reading
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

  )
}

export default Anytics