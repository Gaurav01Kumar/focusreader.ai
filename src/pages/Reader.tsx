import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { get } from "idb-keyval";
import {
  Maximize2,
  Minimize2,
  ChevronRight,
  MessageSquare,
  StickyNote,
  X,
  Sparkles,
  BellOff,
  Bell,
  Download,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Search,
  Send,
  Plus,
  FileText,
  BarChart2,
  AlertTriangle,
  Brain,
  WifiOff,
  Trash2,
  GraduationCap,
  BookOpen,
  Layers,
  AlignLeft,
  Hash,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateQuiz } from "../services/aiService";
import { Note, Folder as FolderType } from "../types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getBaseDomain } from "../utils";
import { useNavigate, useParams } from "react-router-dom";
import { showToast } from "../utils/toast";
import { ReaderApi } from "../apis/readeer.service";
import Anytics from "../components/Anytics";
import { DashboardApi } from "../apis/dashboard.api";
import QuizModel from "../components/QuizModel";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ─── Constants ────────────────────────────────────────────────────────────────
const LEFT_W = 260;
const RIGHT_W = 360;
const PAGE_BUFFER = 2; // render current ± 2 pages
const APPROX_PAGE_HEIGHT = 900; // placeholder height for unrendered pages (px at scale 1.2)

// ─── Debounce helper ──────────────────────────────────────────────────────────
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

// ─── useIsMobile ─────────────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = debounce(() => setIsMobile(window.innerWidth < 768), 100);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return isMobile;
}

// ─── OutlineItem ─────────────────────────────────────────────────────────────
function OutlineItem({
  item,
  depth = 0,
  onItemClick,
}: {
  item: any;
  depth?: number;
  onItemClick: (d: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasItems = item.items?.length > 0;
  return (
    <div>
      <div
        onClick={() => {
          if (item.dest) onItemClick(item.dest);
          if (hasItems) setIsOpen(!isOpen);
        }}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-all group",
          depth > 0 && "ml-3 border-l",
        )}
        style={{ borderColor: depth > 0 ? "var(--border)" : undefined }}
      >
        {hasItems ? (
          <ChevronRight
            size={10}
            className={cn(
              "shrink-0 transition-transform",
              isOpen && "rotate-90",
            )}
            style={{ color: "var(--text3)" }}
          />
        ) : (
          <div className="w-2.5" />
        )}
        <span
          className="text-[11px] truncate flex-1 transition-colors group-hover:text-white"
          style={{ color: "var(--text2)" }}
        >
          {item.title}
        </span>
      </div>
      {hasItems && isOpen && (
        <div>
          {item.items.map((s: any, i: number) => (
            <OutlineItem
              key={i}
              item={s}
              depth={depth + 1}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type LeftTab = "outline" | "search" | "notes";

// ─── Main Reader ─────────────────────────────────────────────────────────────
export default function Reader() {
  const { pdfId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // PDF state
  const [restoredPage, setRestoredPage] = useState<number>(1);
  const [file, setFile] = useState<File | string | null>(null);
  const [fileName, setFileName] = useState("");
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  // displayScale: what user is dragging; scale: debounced value applied to Pages
  const [displayScale, setDisplayScale] = useState(1.2);
  const [scale, setScale] = useState(1.2);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfOutline, setPdfOutline] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // UI state
  const [leftTab, setLeftTab] = useState<LeftTab>("outline");
  const [leftOpen, setLeftOpen] = useState(!isMobile); // closed by default on mobile
  const [rightOpen, setRightOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Search
  const [pdfSearchQuery, setPdfSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { page: number; text: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);

  // Notes & folders
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<
    string | undefined
  >();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // AI
  const [selectedText, setSelectedText] = useState("");
  const [selectionCoords, setSelectionCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; content: string }[]
  >([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Quiz
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  // Analytics
  const [startTime] = useState(Date.now());
  const [timeSpent, setTimeSpent] = useState(0);
  const [pagesRead, setPagesRead] = useState<Set<number>>(new Set([1]));
  const [distractionCount, setDistractionCount] = useState(0);
  const [showDistractionWarning, setShowDistractionWarning] = useState(false);

  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const bufferRef = useRef("");
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Single shared IntersectionObserver — created once, attached via ref callbacks
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const p = parseInt((e.target as HTMLElement).id.split("-")[1]);
            if (!isNaN(p)) setPageNumber(p);
          }
        });
      },
      { threshold: 0.4, rootMargin: "0px" },
    );
    return () => observerRef.current?.disconnect();
  }, []); // ← empty: create once

  // Attach observer via ref callback on each page wrapper
  const observePage = useCallback((el: HTMLDivElement | null) => {
    if (el) observerRef.current?.observe(el);
  }, []);

  // ── Debounce scale: wait 300ms after user stops clicking zoom ──────────────
  useEffect(() => {
    const t = setTimeout(() => setScale(displayScale), 300);
    return () => clearTimeout(t);
  }, [displayScale]);

  // ── Data loading ───────────────────────────────────────────────────────────
  async function reopenFile(fileId: string) {
    const handle = await get(fileId);
    if (!handle) {
      showToast("File not found. Please reselect.", "error");
      return;
    }
    const perm = await handle.queryPermission({ mode: "read" });
    if (perm !== "granted") {
      const np = await handle.requestPermission({ mode: "read" });
      if (np !== "granted") {
        showToast("Permission denied.", "error");
        return;
      }
    }
    setFile(await handle.getFile());
  }

  async function fetchPdfAndData() {
    try {
      const r = await ReaderApi.getInstance().getRecentFileId(pdfId as string);
      if (r.statusCode === 200) {
        const { file_path, isUrl, fileId, name, lastPage } = r.data;
        setFileName(name);
        setRestoredPage(lastPage || 1);
        if (isUrl) setFile(file_path);
        else await reopenFile(fileId);
      }
    } catch {}
  }

  useEffect(() => {
    if (pdfId) fetchPdfAndData();
  }, [pdfId]);

  useEffect(() => {
    const on = () => setIsOnline(true),
      off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    setLoadError(null);
    setNumPages(null);
    setPageNumber(1);
  }, [file]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  async function onDocumentLoadSuccess(pdf: any) {
    setNumPages(pdf.numPages);
    setPdfDoc(pdf);
    try {
      setPdfOutline((await pdf.getOutline()) || []);
    } catch {}
    setTimeout(() => {
      if (restoredPage > 1) scrollToPage(restoredPage);
    }, 400);
  }

  // ── Virtualized page list ──────────────────────────────────────────────────
  // Only render pages within ±PAGE_BUFFER of current page; placeholder divs for the rest.
  const visiblePageSet = useMemo(() => {
    const s = new Set<number>();
    for (
      let i = Math.max(1, pageNumber - PAGE_BUFFER);
      i <= Math.min(numPages || 1, pageNumber + PAGE_BUFFER);
      i++
    ) {
      s.add(i);
    }
    return s;
  }, [pageNumber, numPages]);

  // ── Search with yielding ───────────────────────────────────────────────────
  const handlePdfSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfSearchQuery.trim() || !pdfDoc || isSearching) return;
    setIsSearching(true);
    const results: { page: number; text: string }[] = [];
    try {
      for (let i = 1; i <= pdfDoc.numPages && results.length < 20; i++) {
        // Yield to UI every 5 pages so the app doesn't freeze on mobile
        if (i % 5 === 0) await new Promise((r) => setTimeout(r, 0));
        const page = await pdfDoc.getPage(i);
        const text = (await page.getTextContent()).items
          .map((x: any) => x.str)
          .join(" ");
        if (text.toLowerCase().includes(pdfSearchQuery.toLowerCase())) {
          const idx = text.toLowerCase().indexOf(pdfSearchQuery.toLowerCase());
          results.push({
            page: i,
            text: `...${text.substring(Math.max(0, idx - 40), idx + pdfSearchQuery.length + 40)}...`,
          });
        }
      }
      setSearchResults(results);
    } catch {
    } finally {
      setIsSearching(false);
    }
  };

  // ── Text selection — debounced 150ms to avoid firing on every tap ──────────
  const handleTextSelection = useCallback(
    debounce(() => {
      const sel = window.getSelection();
      const text = sel?.toString().trim();
      if (text && text.length > 3) {
        setSelectedText(text);
        const rect = sel?.getRangeAt(0).getBoundingClientRect();
        if (rect) {
          setSelectionCoords({ x: rect.left + rect.width / 2, y: rect.top });
        }
        setAiExplanation(null);
      } else if (!isAiLoading) {
        setSelectedText("");
        setSelectionCoords(null);
      }
    }, 150),
    [isAiLoading],
  );

  // ── AI ─────────────────────────────────────────────────────────────────────
  const handleAskAI = async (
    type: "explain" | "summarize" | "examples" = "explain",
  ) => {
    if (!isOnline || !selectedText) return;
    setRightOpen(true);
    // On mobile, close left panel when AI opens to save space
    if (isMobile) setLeftOpen(false);
    setIsAiLoading(true);
    setSelectionCoords(null);

    const truncated =
      selectedText.length > 120
        ? selectedText.slice(0, 120) + "…"
        : selectedText;
    const labelMap = {
      explain: `Explain: "${truncated}"`,
      summarize: `Summarize: "${truncated}"`,
      examples: `Give examples for: "${truncated}"`,
    };
    const userMessage = labelMap[type];

    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: userMessage },
      { role: "ai", content: "" },
    ]);

    let aiText = "";

    try {
      const response = await fetch(`${getBaseDomain()}model/ai-tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: selectedText, type }),
        credentials: "include",
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bufferRef.current += decoder.decode(value, { stream: true });
        while (true) {
          const le = bufferRef.current.indexOf("\n");
          if (le === -1) break;
          const line = bufferRef.current.slice(0, le).trim();
          bufferRef.current = bufferRef.current.slice(le + 1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const p = JSON.parse(data);
            if (p?.content) {
              aiText += p.content;
              const snap = aiText;
              setChatHistory((prev) => {
                const u = [...prev];
                u[u.length - 1] = { ...u[u.length - 1], content: snap };
                return u;
              });
            }
          } catch {}
        }
      }
      setAiExplanation(aiText);
    } catch {
      showToast("AI request failed", "error");
      setChatHistory((prev) => {
        const u = [...prev];
        u[u.length - 1] = {
          ...u[u.length - 1],
          content: "Error — please try again.",
        };
        return u;
      });
    } finally {
      setIsAiLoading(false);
      readerRef.current = null;
    }
  };

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiLoading || !isOnline) return;
    const msg = chatInput.trim();
    setChatInput("");
    setIsAiLoading(true);

    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: msg },
      { role: "ai", content: "" },
    ]);

    let aiText = "";

    try {
      const response = await fetch(`${getBaseDomain()}model/ai-tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_input: msg,
          type: "chat",
          context: selectedText,
          history: chatHistory,
        }),
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bufferRef.current += decoder.decode(value, { stream: true });
        while (true) {
          const le = bufferRef.current.indexOf("\n");
          if (le === -1) break;
          const line = bufferRef.current.slice(0, le).trim();
          bufferRef.current = bufferRef.current.slice(le + 1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const p = JSON.parse(data);
            if (p?.content) {
              aiText += p.content;
              const snap = aiText;
              setChatHistory((prev) => {
                const u = [...prev];
                u[u.length - 1] = { ...u[u.length - 1], content: snap };
                return u;
              });
            }
          } catch {}
        }
      }
    } catch {
      setChatHistory((prev) => {
        const u = [...prev];
        u[u.length - 1] = {
          ...u[u.length - 1],
          content: "Error processing request.",
        };
        return u;
      });
    } finally {
      setIsAiLoading(false);
      readerRef.current = null;
    }
  };

  // ── Quiz ───────────────────────────────────────────────────────────────────
  const handleGenerateQuiz = async () => {
    if (!selectedText || !isOnline) return;
    setIsAiLoading(true);
    setSelectionCoords(null);
    const questions = await generateQuiz(selectedText);
    if (questions.length > 0) {
      setQuizQuestions(questions);
      setCurrentQuizIndex(0);
      setQuizScore(0);
      setQuizAnswered(null);
      setShowQuiz(true);
      setShowQuizResult(false);
    }
    setIsAiLoading(false);
    setSelectedText("");
  };

  // ── Misc ───────────────────────────────────────────────────────────────────
  const scrollToPage = (p: number) =>
    document
      .getElementById(`page-${p}`)
      ?.scrollIntoView({ behavior: "smooth" });

  const handleOutlineClick = async (dest: any) => {
    if (!pdfDoc || !dest) return;
    try {
      const d =
        typeof dest === "string" ? await pdfDoc.getDestination(dest) : dest;
      if (d) scrollToPage((await pdfDoc.getPageIndex(d[0])) + 1);
    } catch {}
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };

  useEffect(() => {
    const h = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // Distraction tracking
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let hasLeft = false;
    const h = () => {
      if (document.visibilityState === "hidden") {
        hasLeft = true;
        setDistractionCount((p) => p + 1);
      } else if (hasLeft) {
        setShowDistractionWarning(true);
        hasLeft = false;
        timer = setTimeout(() => setShowDistractionWarning(false), 3000);
      }
    };
    document.addEventListener("visibilitychange", h);
    return () => {
      document.removeEventListener("visibilitychange", h);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setTimeSpent(Math.floor((Date.now() - startTime) / 1000)),
      1000,
    );
    return () => clearInterval(t);
  }, [startTime]);

  useEffect(() => {
    setPagesRead((p) => new Set([...p, pageNumber]));
  }, [pageNumber]);

  const calculateFocusScore = () =>
    Math.max(
      0,
      Math.min(
        100,
        100 -
          distractionCount * 5 +
          Math.min(20, Math.floor(timeSpent / 300) * 5),
      ),
    );
  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  const saveToNotes = async () => {
    try {
      const lastUserMsg = [...chatHistory]
        .reverse()
        .find((m) => m.role === "user")?.content;
      const noteText = selectedText || lastUserMsg || "Note";
      const noteExplanation =
        aiExplanation ||
        [...chatHistory].reverse().find((m) => m.role === "ai")?.content;

      const response = await ReaderApi.getInstance().saveNote({
        text: noteText,
        explanation: noteExplanation || undefined,
        pageNumber,
        folderId: selectedFolderId,
        highlight: selectedColor,
        fileId: pdfId as string,
      });

      if (response.statusCode === 201) {
        setSelectedText("");
        setAiExplanation(null);
        setChatHistory([]);
        loadNotes();
        showToast("Note saved", "success");
      } else {
        showToast("Failed to save note", "error");
      }
    } catch {
      showToast("Failed to save note", "error");
    }
  };

  async function loadNotes() {
    try {
      const r = await ReaderApi.getInstance().getNotesByPdfId(pdfId as string);
      if (r.statusCode === 200) setNotes(r.data);
      else showToast("Failed to load notes", "error");
    } catch {
      showToast("Failed to load notes", "error");
    }
  }

  const handleCreateFolder = async () => {
    try {
      const response = await DashboardApi.getInstance().createFolder({
        name: newFolderName,
      });
      if (response.statusCode === 201) {
        setNewFolderName("");
        setIsCreatingFolder(false);
        loadFolders();
        showToast("Folder created", "success");
      } else {
        showToast("Failed to create folder", "error");
      }
    } catch {
      showToast("Failed to create folder", "error");
    }
  };

  async function loadFolders() {
    try {
      const r = await DashboardApi.getInstance().getFolders();
      if (r.statusCode === 200) setFolders(r.data);
      else showToast("Failed to load folders", "error");
    } catch {
      showToast("Error fetching folders", "error");
    }
  }

  async function handleDeleteNote(noteId: string) {
    try {
      const response = await ReaderApi.getInstance().deleteNote(noteId);
      if (response.statusCode === 200) {
        loadNotes();
        showToast("Note deleted", "success");
      } else showToast("Failed to delete note", "error");
    } catch {
      showToast("Failed to delete note", "error");
    }
  }

  useEffect(() => {
    loadFolders();
    loadNotes();
  }, []);

  // Track reading progress via beacon
  useEffect(() => {
    const payload = () =>
      JSON.stringify({
        fileId: pdfId,
        lastPage: pageNumber,
        totalPages: numPages,
        timeSpent,
        focusScore: calculateFocusScore(),
        distractionCount,
        pagesRead: Array.from(pagesRead),
      });

    const handleUnload = () =>
      navigator.sendBeacon(
        `${getBaseDomain()}recent/update-last-read-page`,
        payload(),
      );

    const handleVisibility = () => {
      if (document.visibilityState === "hidden")
        navigator.sendBeacon(
          `${getBaseDomain()}recent/update-last-read-page`,
          payload(),
        );
    };

    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [pageNumber, pdfId, numPages, timeSpent, distractionCount, pagesRead]);

  // ── Panel width helpers ────────────────────────────────────────────────────
  // On mobile, panels are fixed full-screen bottom sheets
  const panelStyle = (side: "left" | "right") =>
    isMobile
      ? ({
          position: "fixed" as const,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          height: "72vh",
          borderRadius: "16px 16px 0 0",
          borderTop: "1px solid var(--border2)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
        } as React.CSSProperties)
      : ({
          width: side === "left" ? LEFT_W : RIGHT_W,
          willChange: "width, opacity",
          contain: "layout",
        } as React.CSSProperties);

  // ── Render ─────────────────────────────────────────────────────────────────
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
        .f-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .f-sans { font-family: 'Geist', system-ui, sans-serif; }
        .sb::-webkit-scrollbar { width: 3px; height: 3px; }
        .sb::-webkit-scrollbar-track { background: transparent; }
        .sb::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }
        .pdf-container .react-pdf__Page { background: transparent !important; }
        .pdf-container .react-pdf__Page canvas { border-radius: 4px; box-shadow: 0 2px 16px rgba(0,0,0,0.5); }
        .pdf-page-wrapper { margin-bottom: 12px; }
        .react-pdf__Page__textContent { color: transparent; }
        .react-pdf__Page__textContent ::selection { background: rgba(232,199,122,0.35); }
        .btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 7px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.12s; border: none; font-family: 'Geist', system-ui, sans-serif; }
        .btn-ghost { background: transparent; color: var(--text2); padding: 6px 8px; }
        .btn-ghost:hover { background: var(--surface2); color: var(--text); }
        .btn-accent { background: var(--accent); color: #0C0C0E; font-weight: 600; padding: 6px 12px; }
        .btn-accent:hover { opacity: 0.88; }
        .btn-dark { background: var(--surface2); color: var(--text2); border: 1px solid var(--border2); padding: 5px 10px; }
        .btn-dark:hover { background: var(--surface3); color: var(--text); border-color: var(--border2); }
        .icon-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 7px; cursor: pointer; transition: all 0.12s; background: transparent; border: none; color: var(--text2); }
        .icon-btn:hover { background: var(--surface2); color: var(--text); }
        .icon-btn.active { background: var(--accent-dim); color: var(--accent); }
        .panel { background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
        .panel-right { background: var(--surface); border-left: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
        .tab-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 10px 4px; cursor: pointer; transition: all 0.12s; border: none; background: transparent; color: var(--text3); font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; border-right: 1px solid var(--border); }
        .tab-btn:last-child { border-right: none; }
        .tab-btn:hover { background: var(--surface2); color: var(--text2); }
        .tab-btn.active { background: var(--accent-dim); color: var(--accent); }
        .input-base { background: var(--surface2); border: 1px solid var(--border2); color: var(--text); border-radius: 7px; font-family: 'Geist', system-ui, sans-serif; font-size: 12px; transition: border-color 0.15s; outline: none; }
        .input-base::placeholder { color: var(--text3); }
        .input-base:focus { border-color: var(--accent); }
        .section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text3); padding: 12px 12px 6px; }
        /* Mobile bottom sheet drag handle */
        .sheet-handle { width: 36px; height: 4px; background: var(--border2); border-radius: 99px; margin: 10px auto 0; }
        /* Prevent text selection flicker on mobile long-press */
        .pdf-viewport { -webkit-user-select: text; user-select: text; }
      `}</style>

      <div
        className="f-sans flex h-screen overflow-hidden"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        {/* ── Top Nav ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!isFocusMode && (
            <motion.div
              initial={{ y: -44 }}
              animate={{ y: 0 }}
              exit={{ y: -44 }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 h-11 border-b"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              {/* Left */}
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate("/dashboard")}
                >
                  <ArrowLeft size={14} />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
                <div
                  className="w-px h-4 mx-1"
                  style={{ background: "var(--border2)" }}
                />
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                    style={{ background: "var(--accent-dim)" }}
                  >
                    <BookOpen size={11} style={{ color: "var(--accent)" }} />
                  </div>
                  <span
                    className="text-xs font-medium max-w-[160px] truncate hidden sm:block"
                    style={{ color: "var(--text2)" }}
                  >
                    {fileName || "Loading…"}
                  </span>
                </div>
              </div>

              {/* Center */}
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-md"
                  style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Hash size={10} style={{ color: "var(--text3)" }} />
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--text2)" }}
                  >
                    {pageNumber}{" "}
                    <span style={{ color: "var(--text3)" }}>
                      / {numPages || "?"}
                    </span>
                  </span>
                </div>
                <div
                  className="flex items-center rounded-md overflow-hidden"
                  style={{
                    border: "1px solid var(--border)",
                    background: "var(--surface2)",
                  }}
                >
                  <button
                    className="icon-btn rounded-none w-7 h-7"
                    onClick={() =>
                      setDisplayScale((p) =>
                        Math.max(0.4, parseFloat((p - 0.1).toFixed(1))),
                      )
                    }
                  >
                    <ZoomOut size={12} />
                  </button>
                  <span
                    className="text-[10px] font-bold w-10 text-center"
                    style={{ color: "var(--text2)" }}
                  >
                    {Math.round(displayScale * 100)}%
                  </span>
                  <button
                    className="icon-btn rounded-none w-7 h-7"
                    onClick={() =>
                      setDisplayScale((p) =>
                        Math.min(3, parseFloat((p + 0.1).toFixed(1))),
                      )
                    }
                  >
                    <ZoomIn size={12} />
                  </button>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-1">
                <div
                  className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md mr-1"
                  style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span
                    className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--text3)" }}
                  >
                    Focus Active
                  </span>
                </div>
                <button
                  className="icon-btn"
                  onClick={() => setShowAnalytics(true)}
                  title="Analytics"
                >
                  <BarChart2 size={14} />
                </button>
                <button
                  className="icon-btn"
                  onClick={toggleFullScreen}
                  title="Fullscreen"
                >
                  {isFullScreen ? (
                    <Minimize2 size={14} />
                  ) : (
                    <Maximize2 size={14} />
                  )}
                </button>
                <button
                  className={cn("btn", rightOpen ? "btn-accent" : "btn-dark")}
                  onClick={() => {
                    setRightOpen((v) => !v);
                    if (isMobile && !rightOpen) setLeftOpen(false);
                  }}
                >
                  <Sparkles size={12} />
                  <span className="hidden sm:inline">AI Tutor</span>
                </button>
                <button
                  className="btn btn-dark"
                  onClick={() => setIsFocusMode(true)}
                >
                  <BellOff size={12} />
                  <span className="hidden sm:inline">Focus</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div
          className="flex flex-1 min-h-0"
          style={{ paddingTop: isFocusMode ? 0 : 44 }}
        >
          {/* ── Left panel: flex sibling on desktop, fixed sheet on mobile ── */}
          <AnimatePresence initial={false}>
            {!isFocusMode && leftOpen && (
              <motion.div
                initial={isMobile ? { y: "100%" } : { width: 0, opacity: 0 }}
                animate={isMobile ? { y: 0 } : { width: LEFT_W, opacity: 1 }}
                exit={isMobile ? { y: "100%" } : { width: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className={cn("panel shrink-0", isMobile && "panel-right")}
                style={panelStyle("left")}
              >
                {isMobile && <div className="sheet-handle" />}
                {/* Tab strip */}
                <div
                  className="flex border-b shrink-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <button
                    className={cn("tab-btn", leftTab === "outline" && "active")}
                    onClick={() => setLeftTab("outline")}
                  >
                    <Layers size={13} />
                    Contents
                  </button>
                  <button
                    className={cn("tab-btn", leftTab === "search" && "active")}
                    onClick={() => setLeftTab("search")}
                  >
                    <Search size={13} />
                    Search
                  </button>
                  <button
                    className={cn("tab-btn", leftTab === "notes" && "active")}
                    onClick={() => setLeftTab("notes")}
                  >
                    <StickyNote size={13} />
                    Notes
                  </button>
                  <button
                    className="icon-btn ml-auto mr-1 shrink-0 self-center"
                    onClick={() => setLeftOpen(false)}
                  >
                    <X size={12} />
                  </button>
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto sb">
                  {/* Outline */}
                  {leftTab === "outline" && (
                    <div className="p-2">
                      {pdfOutline.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                          <AlignLeft
                            size={20}
                            style={{ color: "var(--text3)" }}
                            className="mb-2"
                          />
                          <p
                            className="text-xs"
                            style={{ color: "var(--text3)" }}
                          >
                            No outline available
                          </p>
                        </div>
                      ) : (
                        pdfOutline.map((item, i) => (
                          <OutlineItem
                            key={i}
                            item={item}
                            onItemClick={handleOutlineClick}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* Search */}
                  {leftTab === "search" && (
                    <div className="p-2">
                      <form
                        onSubmit={handlePdfSearch}
                        className="flex gap-1 mb-3"
                      >
                        <input
                          value={pdfSearchQuery}
                          onChange={(e) => setPdfSearchQuery(e.target.value)}
                          placeholder="Search in document…"
                          className="input-base flex-1 px-2.5 py-2"
                        />
                        <button
                          type="submit"
                          disabled={isSearching}
                          className="btn btn-accent px-2.5 py-2"
                        >
                          {isSearching ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Search size={12} />
                          )}
                        </button>
                      </form>
                      {searchResults.length > 0 && (
                        <div className="space-y-1">
                          {searchResults.map((r, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                scrollToPage(r.page);
                                if (isMobile) setLeftOpen(false);
                              }}
                              className="w-full text-left p-2 rounded-md transition-colors text-xs"
                              style={{ background: "var(--surface2)" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "var(--surface3)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "var(--surface2)")
                              }
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <span
                                  className="font-bold text-[10px] px-1.5 py-0.5 rounded"
                                  style={{
                                    background: "var(--accent-dim)",
                                    color: "var(--accent)",
                                  }}
                                >
                                  p.{r.page}
                                </span>
                              </div>
                              <p
                                className="line-clamp-2 leading-relaxed"
                                style={{ color: "var(--text2)" }}
                              >
                                {r.text}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {leftTab === "notes" && (
                    <div className="p-2 space-y-1.5">
                      {notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                          <StickyNote
                            size={20}
                            style={{ color: "var(--text3)" }}
                            className="mb-2"
                          />
                          <p
                            className="text-xs"
                            style={{ color: "var(--text3)" }}
                          >
                            No notes yet
                          </p>
                          <p
                            className="text-[10px] mt-1"
                            style={{ color: "var(--text3)" }}
                          >
                            Select text to create
                          </p>
                        </div>
                      ) : (
                        notes.map((note) => (
                          <div
                            key={note._id}
                            className="p-2.5 rounded-lg border relative group"
                            style={{
                              background: note.highlight ?? "var(--surface2)",
                              borderColor: note.highlight
                                ? "transparent"
                                : "var(--border)",
                            }}
                          >
                            <p
                              className="text-[10px] font-bold uppercase tracking-widest mb-1"
                              style={{
                                color: note.highlight
                                  ? "rgba(0,0,0,0.4)"
                                  : "var(--text3)",
                              }}
                            >
                              p.{note.pageNumber}
                            </p>
                            <p
                              className="text-[11px] italic line-clamp-2 leading-relaxed"
                              style={{
                                color: note.highlight
                                  ? "rgba(0,0,0,0.6)"
                                  : "var(--text2)",
                              }}
                            >
                              "{note.text}"
                            </p>
                            <button
                              onClick={() =>
                                handleDeleteNote(note._id as string)
                              }
                              className="absolute top-1.5 right-1.5 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: "var(--danger)" }}
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Page jump */}
                <div
                  className="border-t p-2 shrink-0"
                  style={{ borderColor: "var(--border)" }}
                >
                  <p className="section-label p-0 mb-1.5">Jump to page</p>
                  <div className="flex gap-1 flex-wrap max-h-20 overflow-y-auto sb">
                    {numPages &&
                      Array.from({ length: numPages }, (_, i) => i + 1).map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => {
                              scrollToPage(p);
                              if (isMobile) setLeftOpen(false);
                            }}
                            className={cn(
                              "text-[10px] font-mono w-7 h-7 rounded-md transition-all",
                              pageNumber === p ? "font-bold" : "",
                            )}
                            style={{
                              background:
                                pageNumber === p
                                  ? "var(--accent)"
                                  : "var(--surface2)",
                              color:
                                pageNumber === p ? "#0C0C0E" : "var(--text3)",
                              border: `1px solid ${pageNumber === p ? "transparent" : "var(--border)"}`,
                            }}
                          >
                            {p}
                          </button>
                        ),
                      )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle left panel button (desktop only when closed) */}
          {!isFocusMode && !leftOpen && !isMobile && (
            <div
              className="flex flex-col items-center pt-2 px-1 border-r shrink-0"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
              }}
            >
              <button
                className="icon-btn"
                onClick={() => setLeftOpen(true)}
                title="Open panel"
              >
                <Layers size={13} />
              </button>
            </div>
          )}

          {/* ── PDF Viewport ───────────────────────────────────────────── */}
          <div
            ref={containerRef}
            className="pdf-viewport flex-1 overflow-y-auto sb flex flex-col items-center py-4 relative"
            style={
              {
                background: "#181818",
                // Critical mobile performance props:
                touchAction: "pan-y pinch-zoom",
                WebkitOverflowScrolling: "touch",
                willChange: "scroll-position",
              } as React.CSSProperties
            }
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection}
          >
            {/* Distraction banner */}
            <AnimatePresence>
              {showDistractionWarning && (
                <motion.div
                  initial={{ opacity: 0, y: -20, x: "-50%" }}
                  animate={{ opacity: 1, y: 8, x: "-50%" }}
                  exit={{ opacity: 0, y: -20, x: "-50%" }}
                  className="fixed top-14 left-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-xl"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    color: "var(--text)",
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Stay focused 📖
                </motion.div>
              )}
            </AnimatePresence>

            {loadError ? (
              <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto h-full">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: "rgba(248,113,113,0.1)",
                    color: "var(--danger)",
                  }}
                >
                  <AlertTriangle size={28} />
                </div>
                <h3 className="f-serif text-xl mb-2">Unable to Load PDF</h3>
                <p
                  className="text-sm mb-6 leading-relaxed"
                  style={{ color: "var(--text2)" }}
                >
                  {typeof file === "string"
                    ? "This remote PDF couldn't be loaded (likely CORS restrictions)."
                    : "There was an error loading this PDF file."}
                </p>
                {typeof file === "string" && (
                  <button
                    onClick={() => window.open(file, "_blank")}
                    className="btn btn-accent mb-4 w-full justify-center py-2.5"
                  >
                    <Download size={13} /> Open in New Tab
                  </button>
                )}
                <button
                  onClick={() => navigate("/dashboard")}
                  className="btn btn-ghost"
                >
                  <ArrowLeft size={13} /> Back to Dashboard
                </button>
              </div>
            ) : (
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(err) => setLoadError(err)}
                loading={
                  <div className="flex flex-col items-center justify-center py-20">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-3"
                      style={{
                        borderColor: "var(--border2)",
                        borderTopColor: "var(--accent)",
                      }}
                    />
                    <p className="text-xs" style={{ color: "var(--text3)" }}>
                      Loading document…
                    </p>
                  </div>
                }
                className="pdf-container"
              >
                {/*
                  VIRTUALIZED page rendering:
                  - Every page gets a div with a minimum height so scroll position is accurate.
                  - Only pages within ±PAGE_BUFFER of current page actually render a <Page>.
                  - This keeps DOM and GPU memory usage low on mobile.
                */}
                {Array.from({ length: numPages || 0 }, (_, i) => {
                  const p = i + 1;
                  const isVisible = visiblePageSet.has(p);
                  // Approximate rendered height so the scroll container keeps the right total height
                  const placeholderH = Math.round(APPROX_PAGE_HEIGHT * scale);
                  return (
                    <div
                      key={p}
                      id={`page-${p}`}
                      ref={observePage}
                      className="pdf-page-wrapper"
                      style={
                        isVisible
                          ? undefined
                          : { minHeight: placeholderH, width: "100%" }
                      }
                    >
                      {isVisible && (
                        <Page
                          pageNumber={p}
                          renderTextLayer
                          renderAnnotationLayer
                          scale={scale}
                        />
                      )}
                    </div>
                  );
                })}
              </Document>
            )}

            {/* Selection bubble — fixed position, viewport-relative coords */}
            <AnimatePresence>
              {selectedText && !aiExplanation && selectionCoords && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.12 }}
                  style={{
                    position: "fixed",
                    left: selectionCoords.x,
                    top: selectionCoords.y - 70,
                    transform: "translateX(-50%)",
                    zIndex: 200,
                  }}
                >
                  <div
                    className="rounded-xl overflow-hidden shadow-2xl border"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border2)",
                      minWidth: 180,
                    }}
                  >
                    {isAiLoading ? (
                      <div
                        className="flex items-center gap-2.5 px-3 py-3 text-xs font-medium"
                        style={{ color: "var(--text2)" }}
                      >
                        <div
                          className="w-3 h-3 border border-t-transparent rounded-full animate-spin"
                          style={{
                            borderColor: "var(--accent)",
                            borderTopColor: "transparent",
                          }}
                        />
                        Thinking…
                      </div>
                    ) : !isOnline ? (
                      <div
                        className="p-3 text-xs flex items-center gap-2"
                        style={{ color: "var(--danger)" }}
                      >
                        <WifiOff size={11} /> Offline — AI unavailable
                      </div>
                    ) : (
                      <>
                        {[
                          {
                            label: "Ask AI Tutor",
                            icon: (
                              <GraduationCap
                                size={12}
                                style={{ color: "var(--accent)" }}
                              />
                            ),
                            fn: () => handleAskAI("explain"),
                            accent: true,
                          },
                          {
                            label: "Summarize",
                            icon: (
                              <FileText
                                size={12}
                                style={{ color: "#60A5FA" }}
                              />
                            ),
                            fn: () => handleAskAI("summarize"),
                          },
                          {
                            label: "Examples",
                            icon: (
                              <Plus size={12} style={{ color: "#4ADE80" }} />
                            ),
                            fn: () => handleAskAI("examples"),
                          },
                          {
                            label: "Quiz me",
                            icon: (
                              <Brain size={12} style={{ color: "#F472B6" }} />
                            ),
                            fn: handleGenerateQuiz,
                          },
                        ].map(({ label, icon, fn, accent }) => (
                          <button
                            key={label}
                            onClick={fn}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium border-b transition-colors text-left"
                            style={{
                              borderColor: "var(--border)",
                              background: accent
                                ? "var(--accent-dim)"
                                : "transparent",
                              color: "var(--text)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background =
                                "var(--surface2)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = accent
                                ? "var(--accent-dim)"
                                : "transparent")
                            }
                          >
                            {icon} {label}
                          </button>
                        ))}
                        <div
                          className="flex items-center gap-1 px-3 py-1.5 border-b"
                          style={{ borderColor: "var(--border)" }}
                        >
                          {[
                            undefined,
                            "#FEE2E2",
                            "#FEF3C7",
                            "#D1FAE5",
                            "#DBEAFE",
                          ].map((c) => (
                            <button
                              key={c || "none"}
                              onClick={() => setSelectedColor(c)}
                              className={cn(
                                "w-4 h-4 rounded-full transition-transform hover:scale-110 border",
                                selectedColor === c
                                  ? "scale-110 border-white"
                                  : "border-transparent",
                              )}
                              style={{
                                background: c || "rgba(255,255,255,0.08)",
                              }}
                            />
                          ))}
                          <button
                            onClick={saveToNotes}
                            className="icon-btn ml-auto w-6 h-6"
                            title="Save note"
                          >
                            <StickyNote size={11} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  {/* Caret */}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      background: "var(--surface)",
                      border: "1px solid var(--border2)",
                      borderTop: "none",
                      borderLeft: "none",
                      transform: "rotate(45deg)",
                      marginLeft: "calc(50% - 4px)",
                      marginTop: -5,
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Focus mode exit button */}
            <AnimatePresence>
              {isFocusMode && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setIsFocusMode(false)}
                  className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl text-sm font-semibold"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border2)",
                    color: "var(--text)",
                  }}
                >
                  <Bell size={14} /> Exit Focus Mode
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right AI panel ─────────────────────────────────────────── */}
          <AnimatePresence initial={false}>
            {rightOpen && (
              <motion.div
                initial={isMobile ? { y: "100%" } : { width: 0, opacity: 0 }}
                animate={isMobile ? { y: 0 } : { width: RIGHT_W, opacity: 1 }}
                exit={isMobile ? { y: "100%" } : { width: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="panel-right shrink-0 flex flex-col"
                style={panelStyle("right")}
              >
                {isMobile && <div className="sheet-handle" />}

                {/* Header */}
                <div
                  className="shrink-0 flex items-center justify-between px-3 h-10 border-b"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface2)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ background: "var(--accent-dim)" }}
                    >
                      <GraduationCap
                        size={11}
                        style={{ color: "var(--accent)" }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--text)" }}
                    >
                      AI Tutor
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-ghost text-[10px] px-2 py-1"
                      onClick={() => {
                        setAiExplanation(null);
                        setSelectedText("");
                        setChatHistory([]);
                      }}
                    >
                      Clear
                    </button>
                    <button
                      className="icon-btn w-6 h-6"
                      onClick={() => {
                        setRightOpen(false);
                        setAiExplanation(null);
                        setSelectedText("");
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Chat area */}
                <div className="flex-1 overflow-y-auto sb p-3 space-y-3">
                  {chatHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                        style={{
                          background: "var(--surface2)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <MessageSquare
                          size={18}
                          style={{ color: "var(--text3)" }}
                        />
                      </div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: "var(--text2)" }}
                      >
                        AI Tutor ready
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ color: "var(--text3)" }}
                      >
                        Select any text in the document to explain, summarize,
                        or quiz yourself.
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex",
                          msg.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[88%] rounded-xl px-3 py-2.5 text-xs leading-relaxed",
                            msg.role === "user"
                              ? "rounded-tr-none"
                              : "rounded-tl-none",
                          )}
                          style={{
                            background:
                              msg.role === "user"
                                ? "var(--accent)"
                                : "var(--surface2)",
                            color:
                              msg.role === "user" ? "#0C0C0E" : "var(--text)",
                            border:
                              msg.role === "ai"
                                ? "1px solid var(--border)"
                                : "none",
                          }}
                        >
                          {msg.content || (
                            <span className="flex gap-1">
                              {[0, 0.2, 0.4].map((d) => (
                                <span
                                  key={d}
                                  className="w-1.5 h-1.5 rounded-full animate-bounce inline-block"
                                  style={{
                                    background: "var(--text3)",
                                    animationDelay: `${d}s`,
                                  }}
                                />
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Selected text preview */}
                {selectedText && (
                  <div
                    className="shrink-0 mx-3 mb-2 p-2.5 rounded-lg border text-[11px] italic leading-relaxed line-clamp-2"
                    style={{
                      background: "var(--surface2)",
                      borderColor: "var(--border)",
                      color: "var(--text2)",
                    }}
                  >
                    &ldquo;{selectedText}&rdquo;
                  </div>
                )}

                {/* Folder + color row */}
                <div className="shrink-0 px-3 pb-2 flex items-center gap-2 flex-wrap">
                  <select
                    value={selectedFolderId || ""}
                    onChange={(e) =>
                      setSelectedFolderId(e.target.value || undefined)
                    }
                    className="input-base text-[10px] px-2 py-1 flex-1 min-w-0"
                  >
                    <option value="">General</option>
                    {folders.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  {isCreatingFolder ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateFolder();
                          if (e.key === "Escape") setIsCreatingFolder(false);
                        }}
                        placeholder="Name…"
                        className="input-base px-2 py-1 text-[10px] w-24"
                      />
                      <button
                        onClick={() => setIsCreatingFolder(false)}
                        className="icon-btn w-6 h-6"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsCreatingFolder(true)}
                      className="icon-btn w-7 h-7 shrink-0"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                  <div className="flex items-center gap-0.5">
                    {[
                      undefined,
                      "#FEE2E2",
                      "#FEF3C7",
                      "#D1FAE5",
                      "#DBEAFE",
                    ].map((c) => (
                      <button
                        key={c || "none"}
                        onClick={() => setSelectedColor(c)}
                        className={cn(
                          "w-3.5 h-3.5 rounded-full border transition-transform hover:scale-110",
                          selectedColor === c
                            ? "scale-110 border-white"
                            : "border-transparent",
                        )}
                        style={{ background: c || "rgba(255,255,255,0.1)" }}
                      />
                    ))}
                  </div>
                </div>

                {/* Input row */}
                <div className="shrink-0 px-3 pb-3">
                  {aiExplanation && (
                    <button
                      onClick={saveToNotes}
                      className="btn btn-dark w-full justify-center py-2 mb-2 text-[11px]"
                    >
                      <StickyNote size={12} /> Save to Notes
                    </button>
                  )}
                  {isOnline ? (
                    <form onSubmit={handleFollowUp} className="flex gap-2">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask your tutor anything…"
                        className="input-base flex-1 px-3 py-2 text-xs"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isAiLoading}
                        className="btn btn-accent px-2.5 py-2 disabled:opacity-40"
                      >
                        <Send size={12} />
                      </button>
                    </form>
                  ) : (
                    <div
                      className="flex items-center gap-2 p-2.5 rounded-lg text-xs"
                      style={{
                        background: "rgba(248,113,113,0.08)",
                        border: "1px solid rgba(248,113,113,0.2)",
                        color: "var(--danger)",
                      }}
                    >
                      <WifiOff size={12} /> Offline — follow-up disabled
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile backdrop — tap outside to close panels */}
        {isMobile && (leftOpen || rightOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={() => {
              setLeftOpen(false);
              setRightOpen(false);
            }}
            style={{ backdropFilter: "blur(2px)" }}
          />
        )}

        {/* Mobile bottom nav bar */}
        {isMobile && !isFocusMode && (
          <div
            className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 h-14 border-t"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <button
              className={cn(
                "icon-btn flex-col gap-0.5 h-auto py-1 px-3",
                leftOpen && leftTab === "outline" && "active",
              )}
              onClick={() => {
                setLeftTab("outline");
                setLeftOpen((v) => !v || leftTab !== "outline");
                setRightOpen(false);
              }}
            >
              <Layers size={16} />
              <span className="text-[8px] font-semibold uppercase tracking-widest">
                Contents
              </span>
            </button>
            <button
              className={cn(
                "icon-btn flex-col gap-0.5 h-auto py-1 px-3",
                leftOpen && leftTab === "search" && "active",
              )}
              onClick={() => {
                setLeftTab("search");
                setLeftOpen((v) => !v || leftTab !== "search");
                setRightOpen(false);
              }}
            >
              <Search size={16} />
              <span className="text-[8px] font-semibold uppercase tracking-widest">
                Search
              </span>
            </button>
            <button
              className={cn(
                "icon-btn flex-col gap-0.5 h-auto py-1 px-3",
                leftOpen && leftTab === "notes" && "active",
              )}
              onClick={() => {
                setLeftTab("notes");
                setLeftOpen((v) => !v || leftTab !== "notes");
                setRightOpen(false);
              }}
            >
              <StickyNote size={16} />
              <span className="text-[8px] font-semibold uppercase tracking-widest">
                Notes
              </span>
            </button>
            <button
              className={cn(
                "icon-btn flex-col gap-0.5 h-auto py-1 px-3",
                rightOpen && "active",
              )}
              onClick={() => {
                setRightOpen((v) => !v);
                setLeftOpen(false);
              }}
            >
              <Sparkles size={16} />
              <span className="text-[8px] font-semibold uppercase tracking-widest">
                AI
              </span>
            </button>
            <button
              className="icon-btn flex-col gap-0.5 h-auto py-1 px-3"
              onClick={() => setShowAnalytics(true)}
            >
              <BarChart2 size={16} />
              <span className="text-[8px] font-semibold uppercase tracking-widest">
                Stats
              </span>
            </button>
          </div>
        )}

        {/* ── Quiz Modal ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {showQuiz && (
            <QuizModel
              currentQuizIndex={currentQuizIndex}
              showQuiz={showQuiz}
              quizAnswered={quizAnswered}
              quizQuestions={quizQuestions}
              quizScore={quizScore}
              setCurrentQuizIndex={setCurrentQuizIndex}
              setQuizAnswered={setQuizAnswered}
              setShowQuiz={setShowQuiz}
              setQuizScore={setQuizScore}
              showQuizResult={showQuizResult}
              setShowQuizResult={setShowQuizResult}
            />
          )}
        </AnimatePresence>

        {/* Analytics */}
        <Anytics
          numPages={numPages}
          calculateFocusScore={calculateFocusScore}
          formatTime={formatTime}
          distractionCount={distractionCount}
          showAnalytics={showAnalytics}
          pagesRead={pagesRead}
          setShowAnalytics={setShowAnalytics}
          timeSpent={timeSpent}
        />
      </div>
    </>
  );
}
