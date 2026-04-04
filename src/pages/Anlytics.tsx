import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  ArrowLeft, BookOpen, Clock, BarChart3,
  Activity, Brain, Zap, ChevronRight, Target
} from "lucide-react";
import { motion } from "motion/react";
import { ReaderApi } from "../apis/readeer.service";
import DistractionInsights from "../components/Distractioninsights";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

// ── helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  if (!s || s === 0) return "0s";
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function focusColor(score: number) {
  if (score >= 90) return "#4ade80";
  if (score >= 70) return "#f59e0b";
  return "#f87171";
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: "var(--accent)" }}>{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text3)" }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold" style={{ color: "var(--text)", fontFamily: "'Geist', system-ui, sans-serif" }}>
        {value}
      </p>
      <p className="text-[11px]" style={{ color: "var(--text3)" }}>{sub}</p>
    </motion.div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function FileAnalytics() {
  const { pdfId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const r: any = await ReaderApi.getInstance().getRecentFileId(pdfId as string);
      if (r.statusCode === 200) setFile(r.data);
      else setFile(null);
    } catch {
      setFile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [pdfId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--border2)", borderTopColor: "var(--accent)" }} />
          <p className="text-xs" style={{ color: "var(--text3)" }}>Loading insights…</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "var(--text2)" }}>File not found</p>
          <button onClick={() => navigate("/dashboard")}
            className="text-xs px-4 py-2 rounded-lg"
            style={{ background: "var(--surface2)", color: "var(--text2)", border: "1px solid var(--border)" }}>
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const sessions = file.readingSessions || [];
  const maxDur = Math.max(...sessions.map((s: any) => s.duration), 1);
  const progress = Math.round(((file.lastPage || 0) / (file.totalPages || 1)) * 100);
  const totalPagesVisited = new Set(sessions.flatMap((s: any) => s.pagesRead)).size;
  const avgSession = sessions.length > 0 ? Math.round((file.timeSpent || 0) / sessions.length) : 0;

  const pageCount: Record<number, number> = {};
  sessions.forEach((s: any) => s.pagesRead.forEach((p: number) => {
    pageCount[p] = (pageCount[p] || 0) + 1;
  }));

  const showPages = Math.min(file.totalPages, 100);

  const chartData = {
    labels: sessions.map((_: any, i: number) => `S${i + 1}`),
    datasets: [
      {
        label: "Focus",
        data: sessions.map((s: any) => s.focusScore),
        borderColor: "#84cc16",
        backgroundColor: "rgba(132,204,22,0.08)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#4ade80",
        pointRadius: 4,
      },
      {
        label: "Duration (s)",
        data: sessions.map((s: any) => s.duration),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.08)",
        tension: 0.4,
        yAxisID: "y2",
        fill: true,
        pointBackgroundColor: "#f59e0b",
        pointRadius: 4,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
    scales: {
      y: {
        min: 70, max: 105,
        ticks: { color: "#4A4A52", font: { size: 11 } },
        grid: { color: "rgba(255,255,255,0.04)" },
      },
      y2: {
        position: "right", min: 0,
        ticks: { color: "#4A4A52", font: { size: 11 } },
        grid: { display: false },
      },
      x: {
        ticks: { color: "#4A4A52", font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap');
        :root {
          --bg: #0C0C0E; --surface: #141416; --surface2: #1A1A1E; --surface3: #202025;
          --border: #252528; --border2: #2E2E33;
          --text: #F2F2F3; --text2: #8A8A94; --text3: #4A4A52;
          --accent: #E8C77A; --accent-dim: rgba(232,199,122,0.12);
          --danger: #F87171; --success: #4ADE80;
        }
        * { box-sizing: border-box; }
        .f-sans { font-family: 'Geist', system-ui, sans-serif; }
        .sb::-webkit-scrollbar { width: 3px; }
        .sb::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
      `}</style>

      <div className="f-sans min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

        {/* ── Top nav ── */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 h-12 border-b"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: "var(--surface2)", color: "var(--text2)", border: "1px solid var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text2)")}
            >
              <ArrowLeft size={13} /> Dashboard
            </button>
            <span style={{ color: "var(--border2)" }}>/</span>
            <p className="text-xs truncate max-w-[200px]" style={{ color: "var(--text3)" }}>
              {file.name}
            </p>
          </div>

          <button
            onClick={() => navigate(`/reader/${pdfId}`)}
            className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition-opacity"
            style={{ background: "var(--accent)", color: "#0C0C0E" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <BookOpen size={13} /> Continue reading
            <ChevronRight size={12} />
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">

          {/* ── File header card ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--accent-dim)", border: "1px solid rgba(232,199,122,0.2)" }}>
                <BookOpen size={18} style={{ color: "var(--accent)" }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                  {file.name}
                </h1>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text3)" }}>
                  {file.totalSessions} sessions · {file.totalPages} pages · last read {timeAgo(file.lastOpenedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                p.{file.lastPage} / {file.totalPages}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: progress === 100 ? "rgba(74,222,128,0.12)" : "var(--accent-dim)", color: progress === 100 ? "#4ade80" : "var(--accent)" }}>
                {progress}%
              </span>
            </div>
          </motion.div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard delay={0.05} icon={<Clock size={13} />} label="Time spent" value={formatTime(file.timeSpent || 0)} sub="total across sessions" />
            <StatCard delay={0.1} icon={<Activity size={13} />} label="Sessions" value={file.totalSessions || 0} sub={`avg ${formatTime(avgSession)} each`} />
            <StatCard delay={0.15} icon={<Target size={13} />} label="Pages visited" value={totalPagesVisited} sub="unique pages" />
            <StatCard delay={0.2} icon={<Brain size={13} />} label="Avg focus" value={`${file.avgFocusScore ?? 0}%`} sub={`${sessions.reduce((a: number, s: any) => a + s.distractionCount, 0)} distractions`} />
          </div>

          {/* ── Progress bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text3)" }}>
                Reading progress
              </p>
              <span className="text-xs font-semibold" style={{ color: "var(--text2)" }}>
                {file.lastPage} of {file.totalPages} pages
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: "var(--accent)" }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px]" style={{ color: "var(--text3)" }}>Start</span>
              <span className="text-[10px]" style={{ color: "var(--text3)" }}>p.{file.totalPages}</span>
            </div>
          </motion.div>

          {/* ── Sessions ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--text3)" }}>
              Sessions
            </p>

            {sessions.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "var(--text3)" }}>No sessions yet</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((s: any, i: number) => {
                  const pct = Math.round((s.duration / maxDur) * 100);
                  const fc = focusColor(s.focusScore);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.32 + i * 0.04 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-[10px] w-12 text-right shrink-0" style={{ color: "var(--text3)" }}>
                        {new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: fc === "#4ade80" ? "#4ade80" : fc === "#f59e0b" ? "#f59e0b" : "#f87171" }} />
                      </div>
                      <span className="text-[11px] w-8 text-right shrink-0" style={{ color: "var(--text2)" }}>
                        {s.duration}s
                      </span>
                      <span className="text-[11px] font-semibold w-10 text-right shrink-0" style={{ color: fc }}>
                        {s.focusScore}%
                      </span>
                      <span className="text-[10px] w-14 text-right shrink-0" style={{ color: "var(--text3)" }}>
                        {s.pagesRead.length}p read
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
          <DistractionInsights
  sessions={sessions}
  avgFocusScore={file.avgFocusScore ?? 0}
  timeSpent={file.timeSpent ?? 0}
/>

          {/* ── Chart ── */}
          {sessions.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
              className="rounded-2xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text3)" }}>
                  Focus & duration over time
                </p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text3)" }}>
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#84cc16" }} />
                    Focus
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text3)" }}>
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#f59e0b" }} />
                    Duration
                  </span>
                </div>
              </div>
              <div style={{ height: 180 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </motion.div>
          )}

          {/* ── Page heatmap ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
            className="rounded-2xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text3)" }}>
                Pages visited
              </p>
              <div className="flex items-center gap-3">
                {[
                  { label: "unread", bg: "var(--surface2)", border: "1px solid var(--border)" },
                  { label: "once", bg: "#EF9F27" },
                  { label: "2+", bg: "#BA7517" },
                ].map(({ label, bg, border }) => (
                  <span key={label} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text3)" }}>
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: bg, border: border || "none" }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-0.5">
              {Array.from({ length: showPages }, (_, i) => {
                const p = i + 1;
                const visits = pageCount[p] || 0;
                const bg = visits === 0 ? "var(--surface2)" : visits === 1 ? "#EF9F27" : "#BA7517";
                const border = visits === 0 ? "1px solid var(--border)" : "none";
                const color = visits === 0 ? "var(--text3)" : visits === 1 ? "#633806" : "#FAC775";
                return (
                  <div key={p} title={`Page ${p}: ${visits} visit(s)`}
                    className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-medium transition-transform hover:scale-110 cursor-default"
                    style={{ background: bg, border, color }}>
                    {p}
                  </div>
                );
              })}
              {file.totalPages > showPages && (
                <span className="text-[11px] self-center ml-1" style={{ color: "var(--text3)" }}>
                  +{file.totalPages - showPages} more
                </span>
              )}
            </div>
          </motion.div>

          {/* ── Bottom CTA ── */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex gap-3 pb-8"
          >
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "var(--surface2)", color: "var(--text2)", border: "1px solid var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--text2)")}
            >
              <ArrowLeft size={14} /> Back to dashboard
            </button>
            <button
              onClick={() => navigate(`/reader/${pdfId}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity"
              style={{ background: "var(--accent)", color: "#0C0C0E" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <BookOpen size={14} /> Continue reading
            </button>
          </motion.div>

        </div>
      </div>
    </>
  );
}