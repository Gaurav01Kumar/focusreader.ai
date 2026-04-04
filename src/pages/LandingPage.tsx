import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import {
  BookOpen, Sparkles, BellOff, ArrowRight, Shield, Zap, Layout,
  Brain, BarChart2, StickyNote, Search, Headphones, FolderOpen,
  CheckCircle2, ChevronDown, Menu, X, Globe, FileText, GraduationCap,
  TrendingUp, Clock, Eye, Layers
} from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';

// ── SEO Meta ─────────────────────────────────────────────────────────────────
const SEO_TITLE = 'FocusReader AI — Distraction-Free PDF Reading with AI Insights';
const SEO_DESC = 'Read PDFs deeper and faster with FocusReader AI. Instant AI explanations, smart notes, focus mode, quizzes, text-to-speech and reading analytics — all in one beautiful reader.';
const SEO_URL = 'https://focusreader.ai';
const SEO_IMG = 'https://focusreader.ai/og-image.png';

// ── Feature data ──────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Sparkles size={20} />,
    color: '#E8C77A',
    title: 'AI Tutor (Ask Anything)',
    desc: 'Highlight any sentence and instantly get plain-English explanations, summaries, or real-world examples powered by advanced LLMs.',
  },
  {
    icon: <BellOff size={20} />,
    color: '#60A5FA',
    title: 'Distraction-Free Focus Mode',
    desc: 'One click hides every UI element. A distraction detector tracks when you leave the tab and nudges you back.',
  },
  {
    icon: <Brain size={20} />,
    color: '#F472B6',
    title: 'AI-Generated Quizzes',
    desc: 'Select a passage and generate a 5-question multiple-choice quiz on the spot to solidify your understanding.',
  },
  {
    icon: <StickyNote size={20} />,
    color: '#4ADE80',
    title: 'Smart Highlight Notes',
    desc: 'Save highlighted text with color-coded labels and AI explanations. Organize them into folders for any project.',
  },
  {
    icon: <BarChart2 size={20} />,
    color: '#A78BFA',
    title: 'Reading Analytics',
    desc: 'Track time spent, pages read, focus score, and distraction count for every session — become a better reader.',
  },
  {
    icon: <Headphones size={20} />,
    color: '#FB923C',
    title: 'Text-to-Speech',
    desc: 'Listen to any selected passage with AI-generated voice or browser TTS at adjustable speed and volume.',
  },
  {
    icon: <Search size={20} />,
    color: '#2DD4BF',
    title: 'In-Document Search',
    desc: 'Full-text search across all pages with highlighted snippets and one-click navigation to results.',
  },
  {
    icon: <Layers size={20} />,
    color: '#E8C77A',
    title: 'Document Outline',
    desc: 'Auto-extracted PDF table of contents with nested chapter navigation so you always know where you are.',
  },
  {
    icon: <Globe size={20} />,
    color: '#60A5FA',
    title: 'Open PDFs from URLs',
    desc: 'Paste any public PDF link and start reading instantly — no download required.',
  },
  {
    icon: <FolderOpen size={20} />,
    color: '#4ADE80',
    title: 'Folders & Library',
    desc: 'Organize notes into named folders. Search across all your saved highlights from one unified library.',
  },
  {
    icon: <ZoomInIcon size={20} />,
    color: '#F472B6',
    title: 'Zoom & Page Navigation',
    desc: 'Fine-grained zoom control, smooth page jumping, and an at-a-glance page grid for instant navigation.',
  },
  {
    icon: <Shield size={20} />,
    color: '#A78BFA',
    title: 'Privacy First',
    desc: 'PDFs open directly in your browser via the File System Access API — your documents never leave your device.',
  },
];

function ZoomInIcon({ size }: { size: number }) {
  return <Eye size={size} />;
}

// ── Animation helpers ─────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const user = useSelector((state: any) => state.auth.userData);
const navigate=useNavigate();
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  function onStart(){
    navigate('/dashboard')
  }
  return (
    <>
      {/* ── SEO ──────────────────────────────────────────────────────────── */}
      <Helmet>
        <title>{SEO_TITLE}</title>
        <meta name="description" content={SEO_DESC} />
        <meta name="keywords" content="PDF reader, AI reading, focus mode, AI tutor, PDF annotator, study tool, reading analytics, distraction free" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={SEO_URL} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SEO_URL} />
        <meta property="og:title" content={SEO_TITLE} />
        <meta property="og:description" content={SEO_DESC} />
        <meta property="og:image" content={SEO_IMG} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SEO_TITLE} />
        <meta name="twitter:description" content={SEO_DESC} />
        <meta name="twitter:image" content={SEO_IMG} />

        {/* Structured data */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "FocusReader AI",
          "description": SEO_DESC,
          "url": SEO_URL,
          "applicationCategory": "ProductivityApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        })}</script>

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Helmet>

      <style>{`
        :root {
          --bg: #0C0C0E; --surface: #141416; --surface2: #1A1A1E;
          --border: #252528; --border2: #2E2E33;
          --text: #F0F0F2; --text2: #8A8A94; --text3: #4A4A52;
          --accent: #E8C77A; --accent-dim: rgba(232,199,122,0.10);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); font-family: 'Geist', system-ui, sans-serif; }
        ::selection { background: var(--accent); color: #0C0C0E; }
        .f-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .f-sans  { font-family: 'Geist', system-ui, sans-serif; }
        .sb::-webkit-scrollbar { width: 3px; }
        .sb::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
        /* Grain overlay */
        .grain::after {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 999;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.025;
        }
        .glow-text { background: linear-gradient(135deg, #F0F0F2 0%, #8A8A94 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .accent-text { background: linear-gradient(135deg, #E8C77A 0%, #D4A843 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; background: var(--accent); color: #0C0C0E;
          border-radius: 12px; font-weight: 700; font-size: 15px;
          border: none; cursor: pointer; transition: all 0.2s; font-family: 'Geist', system-ui, sans-serif;
          text-decoration: none;
        }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(232,199,122,0.25); }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; background: transparent; color: var(--text);
          border-radius: 12px; font-weight: 600; font-size: 15px;
          border: 1px solid var(--border2); cursor: pointer; transition: all 0.2s; font-family: 'Geist', system-ui, sans-serif;
          text-decoration: none;
        }
        .btn-outline:hover { background: var(--surface2); border-color: var(--text3); }
        .nav-link { color: var(--text2); font-size: 14px; font-weight: 500; text-decoration: none; transition: color 0.15s; }
        .nav-link:hover { color: var(--text); }
        .feature-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 24px; transition: all 0.2s;
        }
        .feature-card:hover { border-color: var(--border2); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .step-line { position: absolute; left: 19px; top: 40px; bottom: -32px; width: 1px; background: linear-gradient(to bottom, var(--border2), transparent); }
        .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 28px; text-align: center; }
      `}</style>

      <div className="grain min-h-screen">

        {/* ── Nav ──────────────────────────────────────────────────────────── */}
        <header
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          style={{
            background: scrolled ? 'rgba(12,12,14,0.9)' : 'transparent',
            backdropFilter: scrolled ? 'blur(16px)' : 'none',
            borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
          }}
        >
          <nav className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2 text-decoration-none">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <BookOpen size={14} style={{ color: '#0C0C0E' }} />
              </div>
              <span className="f-serif text-lg" style={{ color: 'var(--text)' }}>FocusReader</span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>AI</span>
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              {['Features', 'How it works', 'About'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} className="nav-link">{l}</a>
              ))}
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: 13 }}
                >
                  Dashboard <ArrowRight size={13} />
                </Link>
              ) : (
                <>
                  <button
                    className="btn-outline"
                    style={{ padding: '8px 18px', fontSize: 13 }}
                    onClick={() => {
                      window.location.href = "https://focusreader-ai.onrender.com/auth/google";
                    }}
                  >
                    Sign in with Google
                  </button>

                  <button
                    className="btn-primary"
                    style={{ padding: '8px 18px', fontSize: 13 }}
                    onClick={onStart}
                  >
                    Start free <ArrowRight size={13} />
                  </button>
                </>
              )}
            </div>

            {/* Mobile toggle */}
            <button className="md:hidden p-2 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
              onClick={() => setMobileOpen(v => !v)}>
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </nav>

          {/* Mobile menu */}
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="md:hidden px-5 pb-4 flex flex-col gap-3"
              style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              {['Features', 'How it works', 'About'].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} className="nav-link py-2"
                  onClick={() => setMobileOpen(false)}>{l}</a>
              ))}
              <button className="btn-primary justify-center" onClick={() => { setMobileOpen(false); onStart(); }}>
                Start Reading Free
              </button>
            </motion.div>
          )}
        </header>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-20 pb-16 overflow-hidden">
          {/* Background glow */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232,199,122,0.07) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, pointerEvents: 'none',
            background: 'linear-gradient(to bottom, transparent, var(--bg))',
          }} />

          {/* Badge */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold"
            style={{ background: 'var(--accent-dim)', border: '1px solid rgba(232,199,122,0.2)', color: 'var(--accent)' }}>
            <Sparkles size={12} />
            AI-powered reading — now available
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }}
            className="f-serif max-w-3xl mx-auto mb-6 leading-tight"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: 'var(--text)' }}>
            Read deeper.<br />
            <span className="accent-text">Understand faster.</span>
          </motion.h1>

          {/* Subline */}
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.16 }}
            className="max-w-xl mx-auto mb-10 leading-relaxed text-base sm:text-lg"
            style={{ color: 'var(--text2)' }}>
            The only PDF reader designed to eliminate distractions, give you instant AI explanations for anything you read, and track how well you focus.
          </motion.p>

          {/* CTAs */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24 }}
            className="flex flex-col sm:flex-row gap-3 mb-14">
            <button className="btn-primary" onClick={onStart}>
              Start reading free <ArrowRight size={15} />
            </button>
            <a href="#features" className="btn-outline">
              See all features <ChevronDown size={15} />
            </a>
          </motion.div>
          {/* Scroll arrow */}
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{ color: 'var(--text3)' }}>
            <ChevronDown size={20} />
          </motion.div>
        </section>
        {/* ── Features ────────────────────────────────────────────────────────── */}
        <section id="features" className="py-24 px-5" style={{ background: 'var(--bg)' }}>
          <div className="w-full mx-auto">
            <FadeIn className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>Everything you need</p>
              <h2 className="f-serif mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--text)' }}>
                A complete reading intelligence platform
              </h2>
              <p className="max-w-lg mx-auto text-base" style={{ color: 'var(--text2)' }}>
                12 powerful features built into one clean interface — no plugins, no extensions.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => (
                <FadeIn key={f.title} delay={i * 0.04}>
                  <div className="feature-card h-full">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 shrink-0"
                      style={{ background: `${f.color}15`, color: f.color }}>
                      {f.icon}
                    </div>
                    <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>{f.title}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>{f.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 px-5" style={{ background: 'var(--surface)' }}>
          <div className="w-full mx-auto">
            <FadeIn className="text-center mb-16">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--accent)' }}>The workflow</p>
              <h2 className="f-serif mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--text)' }}>
                From upload to mastery<br />in three steps
              </h2>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-16 items-center">
              {/* Steps */}
              <div className="space-y-10">
                {[
                  {
                    step: '01', icon: <FileText size={16} />, color: '#E8C77A',
                    title: 'Open your PDF',
                    desc: 'Upload a file from your device, drag and drop it, or paste a public PDF URL. Your documents are processed locally — never uploaded to our servers.',
                  },
                  {
                    step: '02', icon: <BellOff size={16} />, color: '#60A5FA',
                    title: 'Enter Focus Mode',
                    desc: 'Strip away every UI element with one click. The distraction detector watches your tab — if you leave, it gently brings you back.',
                  },
                  {
                    step: '03', icon: <GraduationCap size={16} />, color: '#4ADE80',
                    title: 'Learn with AI',
                    desc: 'Select any text to explain it, summarize it, get examples, quiz yourself, or listen to it read aloud. Your notes auto-save to your library.',
                  },
                ].map((item, i, arr) => (
                  <FadeIn key={item.step} delay={i * 0.1}>
                    <div className="flex gap-5 relative">
                      {i < arr.length - 1 && <div className="step-line" />}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 relative z-10"
                        style={{ background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text3)' }}>Step {item.step}</div>
                        <h3 className="text-base font-semibold mb-1.5" style={{ color: 'var(--text)' }}>{item.title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>{item.desc}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>

              {/* Mock reader UI */}
              <FadeIn delay={0.2}>
                <div className="rounded-2xl overflow-hidden border" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                  {/* Fake nav */}
                  <div className="flex items-center justify-between px-4 h-10 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md" style={{ background: 'var(--accent-dim)' }} />
                      <div className="w-24 h-2.5 rounded-full" style={{ background: 'var(--border2)' }} />
                    </div>
                    <div className="flex gap-1.5">
                      {['#E8C77A', '#60A5FA', '#4ADE80'].map(c => (
                        <div key={c} className="w-5 h-5 rounded-md" style={{ background: `${c}20` }} />
                      ))}
                    </div>
                  </div>
                  {/* PDF area */}
                  <div className="flex">
                    {/* Sidebar strip */}
                    <div className="w-10 border-r flex flex-col items-center py-3 gap-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      {[Layers, Search, StickyNote].map((Icon, i) => (
                        <div key={i} className="w-6 h-6 rounded-md flex items-center justify-center"
                          style={{ background: i === 0 ? 'var(--accent-dim)' : 'transparent', color: i === 0 ? 'var(--accent)' : 'var(--text3)' }}>
                          <Icon size={12} />
                        </div>
                      ))}
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-5 space-y-2.5">
                      <div className="w-3/4 h-2.5 rounded-full" style={{ background: 'var(--border2)' }} />
                      {[1, 0.9, 1, 0.7, 1, 0.85, 1, 0.6].map((w, i) => (
                        <div key={i} className="h-2 rounded-full" style={{ background: 'var(--border)', width: `${w * 100}%` }} />
                      ))}
                      {/* Highlight */}
                      <div className="h-2 rounded-full w-3/5" style={{ background: 'rgba(232,199,122,0.25)' }} />
                      {[0.8, 1, 0.65].map((w, i) => (
                        <div key={i} className="h-2 rounded-full" style={{ background: 'var(--border)', width: `${w * 100}%` }} />
                      ))}
                      {/* AI bubble */}
                      <div className="mt-4 p-3 rounded-xl border text-[10px]"
                        style={{ background: 'var(--surface2)', borderColor: 'var(--border2)', color: 'var(--text2)' }}>
                        <div className="flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--accent)' }}>
                          <Sparkles size={10} />
                          <span className="font-bold uppercase tracking-widest text-[9px]">AI Explanation</span>
                        </div>
                        <p>This concept refers to the systematic analysis of...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>
        {/* ── About ──────────────────────────────────────────────────────────── */}
        <section id="about" className="py-24 px-5 my-2 " style={{ background: 'var(--bg)' }}>
          <div className="w-full mx-auto text-center my-4">
            <FadeIn>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--accent)' }}>Our mission</p>
              <h2 className="f-serif mb-5 leading-tight" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', color: 'var(--text)' }}>
                We believe reading is a superpower.
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2)' }}>
                FocusReader was born from a frustration: the modern web is engineered to steal your attention, yet deep learning demands it. We built the reading environment we always wanted — one that gets out of the way and lets AI bridge the gap between reading and understanding.
              </p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--text2)' }}>
                Your documents are opened directly in your browser via the File System Access API. We never store your PDFs on our servers. Your reading is private by design.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Privacy-first', 'Local file access', 'No ads ever', 'Open to feedback'].map(b => (
                  <div key={b} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
                    <CheckCircle2 size={11} style={{ color: 'var(--accent)' }} /> {b}
                  </div>
                ))}
              </div>
            </FadeIn>

          </div>
        </section>

        {/* ── CTA banner ─────────────────────────────────────────────────────── */}
        <section className="py-24 px-5" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
          <FadeIn>
            <div className="w-full mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold"
                style={{ background: 'var(--accent-dim)', border: '1px solid rgba(232,199,122,0.2)', color: 'var(--accent)' }}>
                <Zap size={12} /> Free to start — no credit card required
              </div>
              <h2 className="f-serif mb-4 leading-tight" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', color: 'var(--text)' }}>
                Start your first<br />focused reading session
              </h2>
              <p className="text-sm mb-10 leading-relaxed" style={{ color: 'var(--text2)' }}>
                Open a PDF, let AI guide you through it, and experience the difference deep reading makes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button className="btn-primary justify-center" onClick={onStart}>
                  Open a PDF now <ArrowRight size={15} />
                </button>
              
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ── Footer ───────────────────────────────────────────────────────────── */}
        <footer style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
          <div className="max-w-5xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <BookOpen size={12} style={{ color: '#0C0C0E' }} />
              </div>
              <span className="f-serif text-base" style={{ color: 'var(--text)' }}>FocusReader</span>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>AI</span>
            </div>

            <nav className="flex flex-wrap justify-center gap-6" aria-label="Footer navigation">
              {[
                { label: 'Features', href: '#features' },
                { label: 'How it works', href: '#how-it-works' },
                { label: 'About', href: '#about' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
              ].map(l => (
                <a key={l.label} href={l.href} className="nav-link text-xs">{l.label}</a>
              ))}
            </nav>

            <p className="text-xs" style={{ color: 'var(--text3)' }}>
              © {new Date().getFullYear()} FocusReader AI. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}