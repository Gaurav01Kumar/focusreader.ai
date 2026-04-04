import { Trash2, Globe, FileText, Clock, BarChart3, Eye, X } from 'lucide-react';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import OverviewModal from './OverviewModal';

const PdfCard = ({ file, handleOpenRecent, handleDeleteRecent }: any) => {
    const navigate = useNavigate();
    const [showOverview, setShowOverview] = useState(false);

    const total = file.totalPages || 1;
    const pct = Math.round(((file.lastPage || 0) / total) * 100);
    const isComplete = pct >= 100;

    const progressColor =
        pct >= 100 ? '#22c55e'
            : pct >= 60 ? '#3b82f6'
                : pct >= 30 ? '#f59e0b'
                    : 'var(--accent)';

    function formatTime(s: number) {
        if (!s) return '0s';
        if (s < 60) return `${s}s`;
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    function timeAgo(dateStr: string) {
        const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        const days = Math.floor(hours / 24);

        if (mins < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    return (
        <>
            <motion.div
                key={file._id}
                className="group grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors hover:bg-[var(--surface2)]"
                onClick={() => handleOpenRecent(file)}
            >

                {/* Icon */}
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
                    {file.isUrl
                        ? <Globe size={13} style={{ color: 'var(--accent)' }} />
                        : <FileText size={13} style={{ color: 'var(--accent)' }} />}
                </div>

                {/* Name + Progress */}
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                            {file.name}
                        </p>

                        <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                            style={{
                                background: isComplete
                                    ? 'rgba(34,197,94,0.12)'
                                    : 'var(--accent-dim)',
                                color: isComplete ? '#22c55e' : 'var(--accent)',
                            }}
                        >
                            {isComplete
                                ? 'Done'
                                : `p.${file.lastPage ?? 1}/${file.totalPages || '?'}`}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-[3px] rounded-full overflow-hidden"
                            style={{ background: 'var(--border2)', maxWidth: 200 }}>
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, background: progressColor }}
                            />
                        </div>

                        <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                            {pct}%
                        </span>
                    </div>
                </div>

                {/* Time */}
                <div className="flex items-center gap-1">
                    <Clock size={11} style={{ color: 'var(--text3)' }} />
                    <span className="text-xs" style={{ color: 'var(--text2)' }}>
                        {formatTime(file.timeSpent ?? 0)}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">

                    {/* 👁 Overview */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowOverview(true);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px]
                        bg-purple-50 text-purple-600 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                        <Eye size={12} />
                        <span className="hidden sm:inline">Overview</span>
                    </button>

                    {/* 📊 Insights */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/insights/${file._id}`);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px]
                        bg-blue-50 text-blue-600 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                        <BarChart3 size={12} />
                        <span className="hidden sm:inline">Insights</span>
                    </button>

                    {/* Last opened */}
                    <span className="text-xs" style={{ color: 'var(--text3)' }}>
                        {timeAgo(file.lastOpenedAt ?? file.createdAt)}
                    </span>

                    {/* Delete */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecent(file._id);
                        }}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--danger)' }}
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </motion.div>

            {/* 🧠 Overview Modal */}
            {showOverview && (
               <OverviewModal  file={file} onClose={() => setShowOverview(false)}/>
            )}
        </>
    );
};

const Stat = ({ label, value }: any) => (
    <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-gray-400 text-[10px]">{label}</p>
        <p className="font-semibold text-sm">{value}</p>
    </div>
);

export default PdfCard;