import { motion } from "motion/react";
import { AlertTriangle, Shield, TrendingDown, Clock, Eye, Zap } from "lucide-react";

interface Session {
  startedAt: string;
  endedAt: string;
  duration: number;
  pagesRead: number[];
  focusScore: number;
  distractionCount: number;
}

interface Props {
  sessions: Session[];
  avgFocusScore: number;
  timeSpent: number;
}

// ── helpers ────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  if (!s || s === 0) return "0s";
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getHour(dateStr: string) {
  return new Date(dateStr).getHours();
}

function focusLabel(score: number) {
  if (score >= 90) return { text: "Deep focus", color: "#4ade80", bg: "rgba(74,222,128,0.1)" };
  if (score >= 70) return { text: "Moderate focus", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" };
  return { text: "Distracted", color: "#f87171", bg: "rgba(248,113,113,0.1)" };
}

// ── sub components ─────────────────────────────────────────────────────────

function FocusRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const { color } = focusLabel(score);
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border2)" strokeWidth="5" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="600"
        fill="var(--text)" fontFamily="'Geist', system-ui">{score}%</text>
    </svg>
  );
}

function SessionCard({ session, index }: { session: Session; index: number }) {
  const label = focusLabel(session.focusScore);
  const isDistracted = session.distractionCount > 0;
  const hour = getHour(session.startedAt);
  const timeOfDay = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  // estimate time lost to distractions (rough: each distraction ~avg 30s of lost focus)
  const estimatedLost = session.distractionCount * 30;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl overflow-hidden"
      style={{
        border: isDistracted ? "1px solid rgba(248,113,113,0.25)" : "1px solid var(--border)",
        background: isDistracted ? "rgba(248,113,113,0.04)" : "var(--surface2)",
      }}
    >
      {/* top accent bar */}
      {isDistracted && (
        <div style={{ height: 3, background: "rgba(248,113,113,0.5)", width: "100%" }} />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <FocusRing score={session.focusScore} />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold" style={{ color: label.color }}>
                  {label.text}
                </span>
                {isDistracted && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                    <AlertTriangle size={9} />
                    {session.distractionCount} distraction{session.distractionCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-[11px]" style={{ color: "var(--text3)" }}>
                {timeOfDay} · {new Date(session.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                {" → "}
                {new Date(session.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {formatTime(session.duration)}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text3)" }}>
              {session.pagesRead.length} pages
            </p>
          </div>
        </div>

        {/* Focus timeline bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--text3)" }}>
            <span>Focus timeline</span>
            <span>{session.focusScore}% sustained</span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "var(--surface3, #202025)" }}>
            {/* full green base */}
            <div className="absolute inset-0 rounded-full"
              style={{ width: `${session.focusScore}%`, background: label.color, opacity: 0.8 }} />
            {/* distraction notches */}
            {Array.from({ length: session.distractionCount }).map((_, di) => {
              const pos = ((di + 1) / (session.distractionCount + 1)) * session.focusScore;
              return (
                <div key={di} className="absolute top-0 h-full w-1"
                  style={{ left: `${pos}%`, background: "#f87171", zIndex: 1 }} />
              );
            })}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg p-2 text-center" style={{ background: "var(--surface)" }}>
            <p className="text-[10px] mb-0.5" style={{ color: "var(--text3)" }}>Duration</p>
            <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{formatTime(session.duration)}</p>
          </div>
          <div className="rounded-lg p-2 text-center"
            style={{ background: isDistracted ? "rgba(248,113,113,0.08)" : "var(--surface)" }}>
            <p className="text-[10px] mb-0.5" style={{ color: "var(--text3)" }}>Distractions</p>
            <p className="text-xs font-semibold" style={{ color: isDistracted ? "#f87171" : "var(--text)" }}>
              {session.distractionCount}
            </p>
          </div>
          <div className="rounded-lg p-2 text-center"
            style={{ background: isDistracted ? "rgba(248,113,113,0.08)" : "var(--surface)" }}>
            <p className="text-[10px] mb-0.5" style={{ color: "var(--text3)" }}>Est. lost</p>
            <p className="text-xs font-semibold" style={{ color: isDistracted ? "#f87171" : "var(--text)" }}>
              {isDistracted ? `~${formatTime(estimatedLost)}` : "—"}
            </p>
          </div>
        </div>

        {/* Tip for bad sessions */}
        {session.focusScore < 70 && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg"
            style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}>
            <AlertTriangle size={11} className="shrink-0 mt-0.5" style={{ color: "#f87171" }} />
            <p className="text-[11px] leading-relaxed" style={{ color: "#f87171" }}>
              High distraction session. Try reading in shorter focused blocks using focus mode.
            </p>
          </div>
        )}
        {session.focusScore >= 70 && session.focusScore < 90 && session.distractionCount > 0 && (
          <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
            <Eye size={11} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
            <p className="text-[11px] leading-relaxed" style={{ color: "#f59e0b" }}>
              A few tab switches detected. Close unrelated tabs before your next session.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── main export ────────────────────────────────────────────────────────────
export default function DistractionInsights({ sessions, avgFocusScore, timeSpent }: Props) {
  const totalDistractions = sessions.reduce((a, s) => a + s.distractionCount, 0);
  const worstSession = [...sessions].sort((a, b) => b.distractionCount - a.distractionCount)[0];
  const bestSession = [...sessions].sort((a, b) => b.focusScore - a.focusScore)[0];
  const cleanSessions = sessions.filter(s => s.distractionCount === 0).length;
  const estimatedTotalLost = totalDistractions * 30;

  // hour distribution for best focus time
  const hourMap: Record<number, { total: number; count: number }> = {};
  sessions.forEach(s => {
    const h = getHour(s.startedAt);
    if (!hourMap[h]) hourMap[h] = { total: 0, count: 0 };
    hourMap[h].total += s.focusScore;
    hourMap[h].count += 1;
  });
  const bestHour = Object.entries(hourMap)
    .map(([h, v]) => ({ hour: parseInt(h), avg: v.total / v.count }))
    .sort((a, b) => b.avg - a.avg)[0];
  const bestHourLabel = bestHour
    ? `${bestHour.hour % 12 || 12}${bestHour.hour < 12 ? "am" : "pm"}`
    : null;

  return (
    <div className="space-y-4">

      {/* ── Overview banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5"
        style={{
          border: totalDistractions > 0 ? "1px solid rgba(248,113,113,0.2)" : "1px solid rgba(74,222,128,0.2)",
          background: totalDistractions > 0 ? "rgba(248,113,113,0.05)" : "rgba(74,222,128,0.05)",
        }}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: totalDistractions > 0 ? "rgba(248,113,113,0.15)" : "rgba(74,222,128,0.15)",
            }}>
            {totalDistractions > 0
              ? <AlertTriangle size={18} style={{ color: "#f87171" }} />
              : <Shield size={18} style={{ color: "#4ade80" }} />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-1"
              style={{ color: totalDistractions > 0 ? "#f87171" : "#4ade80" }}>
              {totalDistractions > 0
                ? `${totalDistractions} distraction${totalDistractions > 1 ? "s" : ""} detected across ${sessions.length} sessions`
                : "Perfect focus — zero distractions!"}
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text3)" }}>
              {totalDistractions > 0
                ? `Estimated ${formatTime(estimatedTotalLost)} of reading time lost to tab switching or leaving the page. ${cleanSessions} of ${sessions.length} sessions were distraction-free.`
                : `All ${sessions.length} sessions were distraction-free. Keep it up!`}
            </p>
          </div>
        </div>

        {/* mini stat row */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { icon: <AlertTriangle size={11} />, label: "Total", value: totalDistractions, danger: totalDistractions > 0 },
            { icon: <TrendingDown size={11} />, label: "Focus avg", value: `${avgFocusScore}%`, danger: avgFocusScore < 70 },
            { icon: <Shield size={11} />, label: "Clean sessions", value: `${cleanSessions}/${sessions.length}`, danger: false },
            { icon: <Clock size={11} />, label: "Est. lost", value: estimatedTotalLost > 0 ? `~${formatTime(estimatedTotalLost)}` : "0s", danger: estimatedTotalLost > 60 },
          ].map(({ icon, label, value, danger }) => (
            <div key={label} className="rounded-xl p-2.5 text-center"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-center mb-1"
                style={{ color: danger ? "#f87171" : "var(--text3)" }}>
                {icon}
              </div>
              <p className="text-xs font-semibold" style={{ color: danger ? "#f87171" : "var(--text)" }}>
                {value}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text3)" }}>{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Best focus tip ── */}
      {bestHourLabel && sessions.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: "rgba(232,199,122,0.06)", border: "1px solid rgba(232,199,122,0.15)" }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--accent-dim)" }}>
            <Zap size={14} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
              Best focus time: {bestHourLabel}
            </p>
            <p className="text-[11px]" style={{ color: "var(--text3)" }}>
              You read with highest concentration during this hour. Schedule tough chapters then.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Per-session breakdown ── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--text3)" }}>
          Session breakdown
        </p>
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <SessionCard key={i} session={session} index={i} />
          ))}
        </div>
      </div>

      {/* ── Improvement tips ── */}
      {totalDistractions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-5"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--text3)" }}>
            How to improve
          </p>
          <div className="space-y-2.5">
            {[
              { icon: <Shield size={12} />, tip: "Use Focus Mode — it hides the UI and tracks when you leave the page." },
              { icon: <Clock size={12} />, tip: "Read in 25-minute blocks (Pomodoro). Short bursts beat long distracted sessions." },
              { icon: <Eye size={12} />, tip: "Close social media tabs before starting. Each switch costs ~5 min of re-focus time." },
              ...(worstSession && getHour(worstSession.startedAt) >= 21
                ? [{ icon: <AlertTriangle size={12} />, tip: "Late-night sessions show more distractions. Try reading earlier in the day." }]
                : []),
            ].map(({ icon, tip }, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }}>{icon}</span>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text2)" }}>{tip}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}