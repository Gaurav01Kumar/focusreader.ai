import { X, BarChart3, Clock, BookOpen, Activity, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

export default function OverviewModal({ file, onClose }: any) {
  const navigate = useNavigate();
  if (!file) return null;

  const total = file.totalPages || 1;
  const progress = Math.round(((file.lastPage || 0) / total) * 100);

  function formatTime(s: number) {
    if (!s) return "0s";
    if (s < 60) return `${s}s`;
    const h = Math.floor(s / 3600);
    const m = Math.floor(s / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
  }

  const stats = [
    {
      icon: <TrendingUp size={12} />,
      label: "Progress",
      value: `${progress}%`,
      sub: progress === 0 ? "just started" : progress === 100 ? "complete" : "in progress",
    },
    {
      icon: <BookOpen size={12} />,
      label: "Page",
      value: `${file.lastPage || 1}`,
      sub: `of ${file.totalPages || "?"} pages`,
    },
    {
      icon: <Clock size={12} />,
      label: "Time spent",
      value: formatTime(file.timeSpent || 0),
      sub: "across all sessions",
    },
    {
      icon: <BarChart3 size={12} />,
      label: "Sessions",
      value: `${file.totalSessions || 0}`,
      sub: `avg focus ${file.avgFocusScore ?? 0}%`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.6)' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center"
              style={{ background: 'var(--accent-dim)', border: '1px solid rgba(232,199,122,0.2)' }}>
              <Activity size={13} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium truncate pr-2"
                style={{ color: 'var(--text)' }}>{file.name}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                Reading performance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text3)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={13} />
          </button>
        </div>

        <div className="p-5">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {stats.map(({ icon, label, value, sub }) => (
              <div key={label} className="rounded-xl p-3"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5 mb-1.5"
                  style={{ color: 'var(--accent)' }}>
                  {icon}
                  <span className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text3)' }}>{label}</span>
                </div>
                <p className="text-xl font-semibold mb-0.5" style={{ color: 'var(--text)' }}>
                  {value}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text3)' }}>Completion</span>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--text2)' }}>
                {progress}%
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>p.{file.lastPage || 1}</span>
              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{file.totalPages} pages</span>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate(`/insights/${file._id}`)}
            className="w-full rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-opacity"
            style={{ background: 'var(--accent)', color: '#0C0C0E' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <BarChart3 size={13} />
            View detailed insights
          </button>
        </div>
      </motion.div>
    </div>
  );
}