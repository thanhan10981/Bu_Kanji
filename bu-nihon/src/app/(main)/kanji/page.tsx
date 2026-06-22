"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Search, Eraser, ScanLine, Download, CreditCard, PenTool,
  X, ChevronRight, Volume2, Pen, Sparkles, BookOpen, Zap,
} from "lucide-react";
import { kanjiData, buShuData, type KanjiItem } from "@/data/kanji";

type Level = "N5" | "N4" | "N3" | "N2" | "N1" | "Bộ thủ";
const LEVELS: Level[] = ["N5", "N4", "N3", "N2", "N1", "Bộ thủ"];

const LEVEL_META: Record<string, { color: string; bg: string; border: string; glow: string; label: string; count: number }> = {
  N5:       { color: "#059669", bg: "linear-gradient(135deg,#d1fae5,#a7f3d0)", border: "#6ee7b7", glow: "#10b98130", label: "Cơ bản",    count: 103  },
  N4:       { color: "#2563eb", bg: "linear-gradient(135deg,#dbeafe,#bfdbfe)", border: "#93c5fd", glow: "#3b82f630", label: "Sơ cấp",    count: 181  },
  N3:       { color: "#d97706", bg: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "#fcd34d", glow: "#f59e0b30", label: "Trung cấp", count: 367  },
  N2:       { color: "#dc2626", bg: "linear-gradient(135deg,#fee2e2,#fecaca)", border: "#fca5a5", glow: "#ef444430", label: "Cao cấp",   count: 367  },
  N1:       { color: "#7c3aed", bg: "linear-gradient(135deg,#ede9fe,#ddd6fe)", border: "#c4b5fd", glow: "#8b5cf630", label: "Nâng cao",  count: 1232 },
  "Bộ thủ": { color: "#0891b2", bg: "linear-gradient(135deg,#cffafe,#a5f3fc)", border: "#67e8f9", glow: "#06b6d430", label: "214 Bộ thủ", count: 214  },
};

/* ── Animated Monkey Component ───────────────────── */
function MonkeyMascot({ size = 80 }: { size?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <style>{`
        @keyframes monkey-bob {
          0%,100% { transform: translateY(0px) rotate(-3deg); }
          50%      { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes monkey-eye-blink {
          0%,90%,100% { transform: scaleY(1); }
          95%          { transform: scaleY(0.1); }
        }
        @keyframes monkey-tail-swing {
          0%,100% { transform: rotate(-20deg); }
          50%      { transform: rotate(20deg); }
        }
        @keyframes monkey-ear-wiggle {
          0%,80%,100% { transform: scale(1); }
          85%          { transform: scale(1.15); }
          90%          { transform: scale(0.95); }
        }
        @keyframes monkey-sparkle {
          0%,100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50%      { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        .monkey-mascot { animation: monkey-bob 2.5s ease-in-out infinite; }
        .monkey-eye   { animation: monkey-eye-blink 4s ease-in-out infinite; transform-origin: center; }
        .monkey-ear-l { animation: monkey-ear-wiggle 3s ease-in-out infinite; }
        .monkey-ear-r { animation: monkey-ear-wiggle 3s ease-in-out infinite 0.15s; }
        .monkey-sparkle-1 { animation: monkey-sparkle 2s ease-in-out infinite 0.3s; }
        .monkey-sparkle-2 { animation: monkey-sparkle 2s ease-in-out infinite 1s; }
        .monkey-sparkle-3 { animation: monkey-sparkle 2s ease-in-out infinite 1.6s; }
      `}</style>
      <svg className="monkey-mascot" width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sparkles around monkey */}
        <g className="monkey-sparkle-1">
          <path d="M10 18 L11.5 15 L13 18 L16 19.5 L13 21 L11.5 24 L10 21 L7 19.5 Z" fill="#fbbf24" opacity="0.9"/>
        </g>
        <g className="monkey-sparkle-2">
          <path d="M65 10 L66 8 L67 10 L69 11 L67 12 L66 14 L65 12 L63 11 Z" fill="#a78bfa" opacity="0.9"/>
        </g>
        <g className="monkey-sparkle-3">
          <path d="M70 55 L71 53 L72 55 L74 56 L72 57 L71 59 L70 57 L68 56 Z" fill="#34d399" opacity="0.9"/>
        </g>
        {/* Tail */}
        <g style={{ transformOrigin: "22px 62px" }} className="monkey-tail-swing" transform="rotate(-20)">
          <path d="M22 62 Q10 70 12 78 Q14 82 18 80" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          <path d="M18 80 Q22 82 22 78" stroke="#fcd34d" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        </g>
        {/* Body */}
        <ellipse cx="40" cy="55" rx="20" ry="18" fill="#f59e0b"/>
        {/* Belly */}
        <ellipse cx="40" cy="58" rx="12" ry="11" fill="#fde68a"/>
        {/* Left ear */}
        <g className="monkey-ear-l" style={{ transformOrigin: "16px 30px" }}>
          <circle cx="16" cy="30" r="9" fill="#f59e0b"/>
          <circle cx="16" cy="30" r="5.5" fill="#fcd34d"/>
        </g>
        {/* Right ear */}
        <g className="monkey-ear-r" style={{ transformOrigin: "64px 30px" }}>
          <circle cx="64" cy="30" r="9" fill="#f59e0b"/>
          <circle cx="64" cy="30" r="5.5" fill="#fcd34d"/>
        </g>
        {/* Head */}
        <ellipse cx="40" cy="30" rx="22" ry="21" fill="#f59e0b"/>
        {/* Face area */}
        <ellipse cx="40" cy="36" rx="14" ry="11" fill="#fde68a"/>
        {/* Left eye */}
        <g className="monkey-eye" style={{ transformOrigin: "32px 27px" }}>
          <circle cx="32" cy="27" r="5" fill="white"/>
          <circle cx="32" cy="27" r="3" fill="#1c1917"/>
          <circle cx="33.2" cy="25.8" r="1" fill="white"/>
        </g>
        {/* Right eye */}
        <g className="monkey-eye" style={{ transformOrigin: "48px 27px" }}>
          <circle cx="48" cy="27" r="5" fill="white"/>
          <circle cx="48" cy="27" r="3" fill="#1c1917"/>
          <circle cx="49.2" cy="25.8" r="1" fill="white"/>
        </g>
        {/* Nose */}
        <ellipse cx="40" cy="34" rx="5" ry="3.5" fill="#d97706"/>
        <circle cx="38" cy="33.5" r="1.2" fill="#92400e"/>
        <circle cx="42" cy="33.5" r="1.2" fill="#92400e"/>
        {/* Smile */}
        <path d="M34 39 Q40 44 46 39" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* Left arm */}
        <ellipse cx="22" cy="53" rx="7" ry="5" fill="#f59e0b" transform="rotate(-20 22 53)"/>
        {/* Right arm holding book */}
        <ellipse cx="58" cy="53" rx="7" ry="5" fill="#f59e0b" transform="rotate(20 58 53)"/>
        {/* Book */}
        <rect x="55" y="50" width="18" height="14" rx="3" fill="#3b82f6"/>
        <rect x="55" y="50" width="9" height="14" rx="3" fill="#2563eb"/>
        <text x="57.5" y="61" fontSize="7" fill="white" fontWeight="900" fontFamily="serif">漢</text>
        {/* Hair tuft */}
        <path d="M33 11 Q40 5 47 11" stroke="#92400e" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <circle cx="40" cy="9" r="3" fill="#92400e"/>
      </svg>
    </div>
  );
}

/* ── Floating Particle Component ─────────────────── */
function FloatingKanji({ char, color, delay, x, y, size = 28 }: {
  char: string; color: string; delay: string; x: string; y: string; size?: number;
}) {
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      width: size + 24, height: size + 24,
      borderRadius: 14,
      background: `${color}18`,
      border: `1.5px solid ${color}40`,
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size, fontFamily: "var(--font-jp)", fontWeight: 700, color,
      animation: "float 3s ease-in-out infinite",
      animationDelay: delay,
      userSelect: "none", pointerEvents: "none",
    }}>
      {char}
    </div>
  );
}

/* ── Animated Mindmap Diagram (Vertical – fits left panel) ── */
function AnimatedMindmap() {
  const nodes = [
    { icon: "漢", label: "2500+ Kanji",     sub: "Chiết tự · N5→N1",      color: "#059669", bg: "#d1fae5", border: "#6ee7b7", cx: 50  },
    { icon: "語", label: "10,000+ Từ vựng", sub: "Minna · Tango · Tettei", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd", cx: 180 },
    { icon: "文", label: "Ngữ pháp N5–N1",  sub: "Minna · Shinkanzen",     color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd", cx: 310 },
  ];

  // SVG dimensions for the branch fan (Bú → 3 cards)
  const SVG_W = 360;
  const SVG_H = 52;
  const startX = SVG_W / 2; // center = 180

  return (
    <div className="mindmap-section animate-fade-in-up">
      {/* BG dot grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(#6366f114 1.5px, transparent 1.5px)", backgroundSize: "24px 24px", pointerEvents: "none", borderRadius: 20 }} />

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20, position: "relative" }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: "linear-gradient(180deg,#6366f1,#06b6d4)", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: "#1e293b", letterSpacing: "-0.3px" }}>Lộ trình học Bú Kanji</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>Từ người mới → JLPT N1</div>
        </div>
      </div>

      {/* ── STEP 1: Bạn + arrow + Bú (horizontal center) ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 0, position: "relative" }}>

        {/* Bạn */}
        <div className="mm-node-user mm-node-in" style={{ animationDelay: "0.05s", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: "white", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.08)", position: "relative" }}>
            <div className="mm-pulse-ring" style={{ position: "absolute", inset: -4, borderRadius: 18, border: "2px solid #6366f130" }} />
            <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
              <circle cx="17" cy="10" r="7" fill="#6366f1" opacity="0.9" />
              <path d="M4 30c0-7.2 5.8-13 13-13s13 5.8 13 13" fill="#6366f1" opacity="0.7" />
              <circle cx="17" cy="10" r="5" fill="#a5b4fc" />
              <circle cx="14.5" cy="9" r="1.2" fill="#312e81" />
              <circle cx="19.5" cy="9" r="1.2" fill="#312e81" />
              <path d="M14 12 Q17 14.5 20 12" stroke="#312e81" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>Bạn</span>
        </div>

        {/* Arrow Bạn → Bú */}
        <div style={{ width: 44, flexShrink: 0, paddingBottom: 18 }}>
          <svg width="44" height="16" viewBox="0 0 44 16" style={{ overflow: "visible" }}>
            <line x1="0" y1="8" x2="32" y2="8" stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="5 4"
              style={{ animation: "mm-dash 0.65s linear infinite" }} />
            <polygon points="32,3 44,8 32,13" fill="#94a3b8" />
          </svg>
        </div>

        {/* Bú */}
        <div className="mm-node-in" style={{ animationDelay: "0.2s", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div className="mm-node-center" style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg,#6366f1,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: "linear-gradient(135deg,rgba(255,255,255,0.22),transparent 55%)", pointerEvents: "none" }} />
            <svg width="36" height="36" viewBox="0 0 80 80" fill="none">
              <ellipse cx="16" cy="30" rx="9" ry="9" fill="#f59e0b"/>
              <ellipse cx="64" cy="30" rx="9" ry="9" fill="#f59e0b"/>
              <ellipse cx="40" cy="55" rx="20" ry="18" fill="#f59e0b"/>
              <ellipse cx="40" cy="58" rx="12" ry="11" fill="#fde68a"/>
              <ellipse cx="40" cy="30" rx="22" ry="21" fill="#f59e0b"/>
              <ellipse cx="40" cy="36" rx="14" ry="11" fill="#fde68a"/>
              <circle cx="32" cy="27" r="5" fill="white"/>
              <circle cx="48" cy="27" r="5" fill="white"/>
              <circle cx="32" cy="27" r="3" fill="#1c1917"/>
              <circle cx="48" cy="27" r="3" fill="#1c1917"/>
              <circle cx="33.2" cy="25.8" r="1" fill="white"/>
              <circle cx="49.2" cy="25.8" r="1" fill="white"/>
              <ellipse cx="40" cy="34" rx="5" ry="3.5" fill="#d97706"/>
              <path d="M34 39 Q40 44 46 39" stroke="#92400e" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <span style={{ fontSize: 12, fontWeight: 900, color: "#4f46e5" }}>Bú</span>
        </div>
      </div>

      {/* ── FAN BRANCHES: Bú → 3 cards ── */}
      <div style={{ width: "100%", overflow: "visible", lineHeight: 0 }}>
        <svg width="100%" height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block", overflow: "visible" }}>
          {nodes.map((n, ni) => (
            <g key={ni}>
              <path
                d={`M ${startX} 0 C ${startX} ${SVG_H * 0.6}, ${n.cx} ${SVG_H * 0.6}, ${n.cx} ${SVG_H}`}
                fill="none"
                stroke={n.color}
                strokeWidth="2"
                strokeDasharray="7 5"
                style={{ animation: "mm-dash 0.7s linear infinite", animationDelay: `${ni * 0.18}s` }}
              />
              {/* dot at bottom of each branch */}
              <circle cx={n.cx} cy={SVG_H} r="4" fill={n.color} opacity="0.85">
                <animate attributeName="r" values="3;5;3" dur="2s" begin={`${ni * 0.3}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
          {/* pulsing origin dot */}
          <circle cx={startX} cy="0" r="5" fill="#6366f1" opacity="0.7">
            <animate attributeName="r" values="4;7;4" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.8s" repeatCount="indefinite" />
          </circle>
        </svg>
      </div>

      {/* ── 3 SUBJECT CARDS (stacked compact) ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 0 }}>
        {nodes.map((n, ni) => (
          <div
            key={n.label}
            className={`mm-card-${ni}`}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px",
              borderRadius: 12,
              background: "white",
              border: `1.5px solid ${n.border}`,
              boxShadow: `0 2px 10px ${n.color}14`,
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
              position: "relative", overflow: "hidden",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(4px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${n.color}28`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 2px 10px ${n.color}14`; }}
          >
            {/* left color accent */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: n.color, borderRadius: "12px 0 0 12px" }} />
            {/* icon */}
            <div style={{ width: 36, height: 36, borderRadius: 9, background: n.bg, border: `1px solid ${n.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontFamily: "var(--font-jp)", fontWeight: 700, color: n.color, flexShrink: 0, marginLeft: 6 }}>
              {n.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1e293b" }}>{n.label}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{n.sub}</div>
            </div>
            {/* mini level dots */}
            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
              {[0,1,2,3,4].map(li => (
                <div key={li} style={{ width: 3, height: 14, borderRadius: 2, background: n.color, opacity: 0.2 + li * 0.18 }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── ARROW DOWN → JLPT ── */}
      <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 0" }}>
        <svg width="20" height="28" viewBox="0 0 20 28">
          <line x1="10" y1="0" x2="10" y2="18" stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="5 4"
            style={{ animation: "mm-dash 0.65s linear infinite", animationDelay: "1s" }} />
          <polygon points="4,16 16,16 10,28" fill="#94a3b8" />
        </svg>
      </div>

      {/* ── JLPT BADGE (full-width, compact) ── */}
      <div className="mm-jlpt" style={{
        display: "flex", alignItems: "center", gap: 0,
        borderRadius: 14,
        background: "linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#312e81 100%)",
        border: "1.5px solid #6366f125",
        boxShadow: "0 8px 28px rgba(99,102,241,0.18)",
        overflow: "hidden",
        cursor: "pointer",
      }}>
        {/* shimmer */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(99,102,241,0.06),transparent)", backgroundSize: "200%", animation: "shimmer 3s ease-in-out infinite", borderRadius: 14, pointerEvents: "none" }} />

        {/* Left: JLPT text */}
        <div style={{ flex: 1, padding: "14px 16px", position: "relative" }}>
          <div style={{ fontSize: 9, color: "#a5b4fc", fontFamily: "var(--font-jp)", letterSpacing: 0.5, marginBottom: 3 }}>日本語能力試験</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: 2, lineHeight: 1 }}>JLPT</div>
          <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>Japanese Language Proficiency Test</div>
        </div>

        {/* Right: N-level color bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, padding: "14px 16px", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { lv: "N5", c: "#34d399" },
            { lv: "N4", c: "#60a5fa" },
            { lv: "N3", c: "#fbbf24" },
            { lv: "N2", c: "#f87171" },
            { lv: "N1", c: "#a78bfa" },
          ].map((x, xi) => (
            <div key={x.lv} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 22, height: 5, borderRadius: 3, background: x.c, boxShadow: `0 0 6px ${x.c}60` }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 700, fontFamily: "monospace" }}>{x.lv}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function KanjiPage() {

  const [query, setQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState<Level>("N5");
  const [selectedKanji, setSelectedKanji] = useState<KanjiItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [hoveredKanji, setHoveredKanji] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"grid" | "draw">("grid");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [strokeCount, setStrokeCount] = useState(0);
  const [recognizing, setRecognizing] = useState(false);
  const [recognized, setRecognized] = useState<string | null>(null);
  const [heroPulse, setHeroPulse] = useState(0);

  const meta = LEVEL_META[activeLevel];

  useEffect(() => {
    const t = setInterval(() => setHeroPulse(p => p + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const filteredKanji = kanjiData.filter((k) => {
    const lvlMatch = k.level === activeLevel || activeLevel === "Bộ thủ";
    const q = query.toLowerCase();
    const textMatch = !q || k.kanji.includes(q) || k.reading.includes(q) || k.meaning.toLowerCase().includes(q);
    return lvlMatch && textMatch;
  });

  const displayItems = activeLevel === "Bộ thủ" ? buShuData : filteredKanji;

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.moveTo(0, 0); ctx.lineTo(w, h);
    ctx.moveTo(w, 0); ctx.lineTo(0, h);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  useEffect(() => { drawGrid(); }, [drawGrid]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    setIsDrawing(true); setRecognized(null); setLastPos(getPos(e, canvas));
  };

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.x, lastPos.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(30,41,59,0.25)"; ctx.shadowBlur = 4; ctx.stroke(); ctx.shadowBlur = 0;
    setLastPos(pos);
  }, [isDrawing, lastPos]);

  const stopDraw = () => { if (isDrawing) setStrokeCount(c => c + 1); setIsDrawing(false); };
  const clearCanvas = () => { drawGrid(); setStrokeCount(0); setRecognized(null); };
  const handleRecognize = () => {
    setRecognizing(true);
    setTimeout(() => {
      const s = ["日","月","火","水","山","川","木","人","大","小"];
      setRecognized(s[Math.floor(Math.random() * s.length)]);
      setRecognizing(false);
    }, 1200);
  };

  const openDetail = (k: KanjiItem) => { setSelectedKanji(k); setDetailOpen(true); };

  return (
    <>
      {/* ── STYLES ─────────────────────────────────── */}
      <style>{`
        @keyframes spin          { to { transform: rotate(360deg); } }
        @keyframes float         { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes shimmer       { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes glow-pulse    { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.05)} }
        @keyframes particle-rise { 0%{opacity:0;transform:translateY(0) scale(0)} 20%{opacity:1} 100%{opacity:0;transform:translateY(-60px) scale(1.5)} }
        @keyframes badge-pop     { 0%{transform:scale(0.8) rotate(-5deg);opacity:0} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes scanline      { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        @keyframes hero-orb      { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-15px) scale(1.1)} 66%{transform:translate(-10px,10px) scale(0.95)} }
        @keyframes level-tab-in  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes kanji-card-in { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }

        /* ── MINDMAP ANIMATIONS ── */
        @keyframes mm-dash        { to { stroke-dashoffset: -28; } }
        @keyframes mm-dot-travel  { 0%{offset-distance:0%} 100%{offset-distance:100%} }
        @keyframes mm-node-in     { from{opacity:0;transform:scale(0.5)} to{opacity:1;transform:scale(1)} }
        @keyframes mm-pulse-ring  { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.8);opacity:0} }
        @keyframes mm-card-in     { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes mm-jlpt-in     { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes mm-user-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes mm-center-glow { 0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.4),0 8px 32px rgba(99,102,241,0.25)} 50%{box-shadow:0 0 0 12px rgba(99,102,241,0),0 8px 40px rgba(99,102,241,0.5)} }

        .mm-dash-line { stroke-dasharray: 8 6; animation: mm-dash 0.7s linear infinite; }
        .mm-node-user { animation: mm-user-float 3s ease-in-out infinite; }
        .mm-node-center { animation: mm-center-glow 2.5s ease-in-out infinite; }
        .mm-pulse-ring  { animation: mm-pulse-ring 1.8s ease-out infinite; }
        .mm-card-0 { animation: mm-card-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.4s both; }
        .mm-card-1 { animation: mm-card-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.6s both; }
        .mm-card-2 { animation: mm-card-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.8s both; }
        .mm-jlpt   { animation: mm-jlpt-in 0.6s cubic-bezier(0.34,1.56,0.64,1) 1.2s both; }
        .mm-node-in { animation: mm-node-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }

        .mindmap-section {
          margin-top: 0;
          border-radius: 20px;
          overflow: visible;
          background: linear-gradient(135deg, #f0f4ff 0%, #e8f4fd 50%, #f0fdf4 100%);
          border: 1px solid #e2e8f0;
          padding: 22px 18px;
          position: relative;
        }
        @media (max-width: 820px) {
          .mindmap-section { padding: 18px 14px; }
        }
        @media (max-width: 520px) {
          .mindmap-section { padding: 14px 10px; border-radius: 14px; }
        }

        /* ── PAGE CONTAINER ── */
        .kanji-page {
          padding: 24px 32px;
          max-width: 1800px;
          box-sizing: border-box;
          width: 100%;
          overflow-x: hidden;
          margin: 0 auto;
        }

        /* ── HERO ── */
        .kanji-hero {
          border-radius: 28px;
          margin-bottom: 28px;
          padding: 40px 48px;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c4a6e 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          min-height: 200px;
        }
        .kanji-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(#ffffff06 1px, transparent 1px),
            linear-gradient(90deg, #ffffff06 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }
        .hero-orb-1 {
          position: absolute; top: -60px; left: -60px;
          width: 280px; height: 280px; border-radius: 50%;
          background: radial-gradient(circle, #6366f150 0%, transparent 70%);
          animation: hero-orb 8s ease-in-out infinite;
          pointer-events: none;
        }
        .hero-orb-2 {
          position: absolute; bottom: -50px; right: 80px;
          width: 220px; height: 220px; border-radius: 50%;
          background: radial-gradient(circle, #06b6d440 0%, transparent 70%);
          animation: hero-orb 10s ease-in-out infinite reverse;
          pointer-events: none;
        }
        .hero-orb-3 {
          position: absolute; top: 20px; right: 240px;
          width: 140px; height: 140px; border-radius: 50%;
          background: radial-gradient(circle, #f472b630 0%, transparent 70%);
          animation: glow-pulse 4s ease-in-out infinite;
          pointer-events: none;
        }
        .kanji-hero-floating {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        /* ── MAIN GRID ── */
        .kanji-main-grid {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 24px;
          align-items: start;
          min-width: 0;
        }
        .kanji-left-panel,
        .kanji-right-panel {
          min-width: 0;
          overflow: hidden;
        }
        .kanji-right-panel .card {
          max-width: 100%;
          overflow: hidden;
        }

        /* ── LEVEL STRIP ── */
        .level-strip {
          padding: 14px 18px;
          border-radius: 14px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          position: relative;
          overflow: hidden;
        }
        .level-strip::after {
          content: '';
          position: absolute; right: 0; top: 0; bottom: 0; width: 60px;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.06));
          pointer-events: none;
        }
        .level-strip-actions { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }

        /* ── KANJI GRID ── */
        .kanji-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(82px, 1fr));
          gap: 10px;
          max-height: 560px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 6px;
          width: 100%;
          box-sizing: border-box;
          scrollbar-width: thin;
          scrollbar-color: var(--color-border) transparent;
        }
        .kanji-grid::-webkit-scrollbar { width: 5px; }
        .kanji-grid::-webkit-scrollbar-track { background: transparent; }
        .kanji-grid::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

        /* ── LEVEL TABS HEADER ── */
        .kanji-right-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .level-tabs { display: flex; gap: 6px; flex-wrap: wrap; }

        /* ── KANJI CARD HOVER ── */
        .kanji-card {
          aspect-ratio: 1/1.1;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          padding: 8px 4px;
          border: 1.5px solid transparent;
          position: relative;
          overflow: hidden;
          animation: kanji-card-in 0.3s ease both;
        }
        .kanji-card::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.2s;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
        }
        .kanji-card:hover::before { opacity: 1; }

        /* ── STAT BOX shimmer ── */
        .stat-shimmer {
          position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
          animation: shimmer 3s ease-in-out infinite;
        }

        /* ── MONKEY PANEL ── */
        .monkey-panel {
          background: linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #4c1d95 100%);
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          border: none;
        }
        .monkey-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 20% 80%, #3b82f625 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, #8b5cf625 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #06b6d415 0%, transparent 60%);
          pointer-events: none;
        }

        /* ── BADGE ANIMATION ── */
        .animated-badge { animation: badge-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

        /* ══ LARGE DESKTOP: ≥ 1600px ══ */
        @media (min-width: 1600px) {
          .kanji-main-grid { grid-template-columns: 440px 1fr; gap: 28px; }
          .kanji-hero { padding: 48px 64px; min-height: 220px; }
          .kanji-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); max-height: 640px; }
        }

        /* ══ TABLET: ≤ 1100px ══ */
        @media (max-width: 1100px) {
          .kanji-page { padding: 18px 22px; }
          .kanji-main-grid { grid-template-columns: 320px 1fr; gap: 18px; }
          .kanji-hero { padding: 28px 32px; }
          .kanji-hero-floating { display: none; }
        }

        /* ══ TABLET-SM: ≤ 820px ══ */
        @media (max-width: 820px) {
          .kanji-page { padding: 14px 16px; }
          .kanji-hero {
            padding: 22px 22px;
            flex-direction: column;
            align-items: flex-start;
            border-radius: 20px;
            gap: 16px;
            min-height: auto;
          }
          .kanji-hero-stats { flex-wrap: wrap; gap: 8px !important; }
          .kanji-hero-stat  { padding: 8px 12px !important; }
          .kanji-hero-floating { display: none; }
          .kanji-main-grid { grid-template-columns: 1fr; gap: 16px; }
          .kanji-left-panel  { order: 2; }
          .kanji-right-panel { order: 1; }
          .kanji-grid {
            max-height: 460px;
            grid-template-columns: repeat(auto-fill, minmax(68px, 1fr));
            gap: 7px;
          }
          .level-strip { flex-direction: column; align-items: flex-start; gap: 10px; }
          .level-strip-actions { margin-left: 0; width: 100%; justify-content: flex-start; }
          .kanji-right-header { flex-direction: column; align-items: flex-start; }
          .level-tabs {
            width: 100%;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .level-tabs::-webkit-scrollbar { display: none; }
          .monkey-panel { display: none; }
        }

        /* ══ MOBILE: ≤ 520px ══ */
        @media (max-width: 520px) {
          .kanji-page  { padding: 10px 10px; }
          .kanji-hero  { padding: 16px 16px; border-radius: 16px; gap: 12px; }
          .kanji-hero h1 { font-size: 22px !important; margin-bottom: 4px !important; }
          .kanji-hero p  { font-size: 12px !important; margin-bottom: 12px !important; }
          .kanji-hero-stat { padding: 6px 10px !important; }
          .kanji-hero-stat .stat-val { font-size: 16px !important; }
          .kanji-grid {
            grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
            gap: 5px;
            max-height: 360px;
          }
          .kanji-right-header h2 { font-size: 14px !important; }
          .level-strip-actions button { padding: 5px 9px !important; font-size: 11px !important; gap: 4px !important; }
          .detail-modal-inner { padding: 18px !important; border-radius: 18px !important; }
          .detail-kanji-box { width: 72px !important; height: 72px !important; font-size: 44px !important; border-radius: 14px !important; }
          .detail-meaning   { font-size: 18px !important; }
          .detail-reading-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
          .detail-actions   { grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
        }
      `}</style>

      <div className="kanji-page">

        {/* ── HERO ──────────────────────────────────── */}
        <div className="kanji-hero animate-fade-in-up">
          {/* BG orbs */}
          <div className="hero-orb-1" />
          <div className="hero-orb-2" />
          <div className="hero-orb-3" />

          {/* Left content */}
          <div style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div className="animated-badge" style={{
                padding: "5px 14px", borderRadius: 9999,
                background: "linear-gradient(90deg, rgba(99,102,241,0.25), rgba(6,182,212,0.2))",
                border: "1px solid rgba(99,102,241,0.4)",
                color: "#a5b4fc", fontSize: 12, fontWeight: 700,
                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                backdropFilter: "blur(8px)",
              }}>
                <Sparkles size={11} style={{ color: "#fbbf24" }} />
                Bú Kanji
              </div>
              <div style={{
                padding: "5px 12px", borderRadius: 9999,
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "#34d399", fontSize: 11, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "glow-pulse 2s infinite" }} />
                Online
              </div>
            </div>

            <h1 style={{ fontSize: "clamp(26px, 3.8vw, 52px)", fontWeight: 900, color: "#fff", margin: "0 0 10px", letterSpacing: "-1.5px", lineHeight: 1.05 }}>
              漢字{" "}
              <span style={{ background: "linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Hán tự
              </span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "clamp(13px, 1.8vw, 15px)", margin: "0 0 22px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <BookOpen size={13} style={{ color: "#60a5fa", flexShrink: 0 }} />
              2500+ Kanji · Tra cứu · Luyện viết · Bộ thủ
            </p>

            <div className="kanji-hero-stats" style={{ display: "flex", gap: 10 }}>
              {[
                { label: "2,136", sub: "Joyo Kanji", icon: "漢", grd: "linear-gradient(135deg,#6366f120,#818cf820)" },
                { label: "214",   sub: "Bộ thủ",    icon: "部", grd: "linear-gradient(135deg,#06b6d420,#22d3ee20)" },
                { label: "5 cấp", sub: "N5 → N1",  icon: "📈", grd: "linear-gradient(135deg,#f59e0b20,#fbbf2420)" },
              ].map((s) => (
                <div key={s.label} className="kanji-hero-stat" style={{
                  padding: "12px 18px", borderRadius: 14,
                  background: s.grd,
                  border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(12px)",
                  position: "relative", overflow: "hidden",
                }}>
                  <div className="stat-shimmer" />
                  <div className="stat-val" style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: monkey + floating kanji */}
          <div className="kanji-hero-floating" style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end", gap: 16 }}>
            {/* Floating kanji cards */}
            <div style={{ position: "relative", width: 180, height: 160 }}>
              <FloatingKanji char="日" color="#10b981" delay="0s"   x="0"   y="10px" size={28} />
              <FloatingKanji char="山" color="#60a5fa" delay="0.5s" x="60px" y="70px" size={24} />
              <FloatingKanji char="愛" color="#f472b6" delay="1s"   x="110px" y="5px" size={32} />
              <FloatingKanji char="力" color="#fbbf24" delay="1.5s" x="120px" y="80px" size={22} />
            </div>
            {/* Animated Monkey */}
            <div style={{ filter: "drop-shadow(0 8px 24px rgba(245,158,11,0.3))" }}>
              <MonkeyMascot size={96} />
            </div>
          </div>
        </div>

        {/* ── MAIN GRID ──────────────────────────────── */}
        <div className="kanji-main-grid">

          {/* ═══ LEFT PANEL ═══════════════════════════ */}
          <div className="kanji-left-panel" style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0, overflow: "hidden" }}>

            {/* Tab switcher */}
            <div style={{ display: "flex", background: "var(--color-card-bg)", border: "1px solid var(--color-border)", borderRadius: 16, padding: 4, gap: 4 }}>
              {(["grid", "draw"] as const).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
                  fontWeight: 700, fontSize: 13,
                  transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                  background: activeTab === t
                    ? "linear-gradient(135deg,var(--color-brand-500),#7c3aed)"
                    : "transparent",
                  color: activeTab === t ? "#fff" : "var(--color-text-secondary)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  boxShadow: activeTab === t ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
                  transform: activeTab === t ? "scale(1.02)" : "scale(1)",
                }}>
                  {t === "grid" ? <Search size={14} /> : <PenTool size={14} />}
                  {t === "grid" ? "Tìm kiếm" : "Vẽ Kanji"}
                </button>
              ))}
            </div>

            {/* ── Search ── */}
            {activeTab === "grid" && (
              <div className="card animate-fade-in-up" style={{ padding: 20 }}>
                <div style={{ position: "relative", marginBottom: 14 }}>
                  <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input id="kanji-search-input" className="input-base" style={{ paddingLeft: 42, fontSize: 15 }} placeholder="Nhập kanji hoặc âm hán việt..." value={query} onChange={(e) => setQuery(e.target.value)} />
                  {query && (
                    <button onClick={() => setQuery("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }}>
                      <X size={16} />
                    </button>
                  )}
                </div>

                {query ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {filteredKanji.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-text-muted)", fontSize: 13 }}>
                        Không tìm thấy kanji nào
                      </div>
                    ) : filteredKanji.slice(0, 6).map((k) => {
                      const lm = LEVEL_META[k.level];
                      return (
                        <button key={k.kanji} onClick={() => openDetail(k)} style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                          borderRadius: 12, border: "1.5px solid var(--color-border)",
                          background: "transparent", cursor: "pointer", textAlign: "left",
                          transition: "all 0.18s ease", width: "100%",
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = lm.glow; e.currentTarget.style.borderColor = lm.border; e.currentTarget.style.transform = "translateX(4px)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = ""; }}
                        >
                          <div style={{ width: 46, height: 46, borderRadius: 11, background: lm.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontFamily: "var(--font-jp)", fontWeight: 700, flexShrink: 0 }}>{k.kanji}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{k.meaning}</div>
                            <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "var(--font-jp)" }}>{k.reading}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, color: lm.color, background: lm.bg }}>{k.level}</span>
                            <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{k.strokeCount} nét</span>
                          </div>
                        </button>
                      );
                    })}
                    {filteredKanji.length > 6 && <div style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-muted)", padding: "4px 0" }}>+{filteredKanji.length - 6} kết quả khác</div>}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <Zap size={10} style={{ color: "#fbbf24" }} /> Kanji phổ biến
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                      {["日","月","火","水","木","金","人","山","川","大","小","中"].map((k) => (
                        <button key={k} onClick={() => setQuery(k)} style={{
                          aspectRatio: "1", borderRadius: 12,
                          border: "1.5px solid var(--color-border)",
                          background: "var(--color-border-light)",
                          fontSize: 22, fontFamily: "var(--font-jp)", fontWeight: 700,
                          cursor: "pointer", transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "var(--color-text-primary)",
                        }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.transform = "translateY(-3px) scale(1.08)"; e.currentTarget.style.boxShadow = "0 6px 16px #3b82f620"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-border-light)"; e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                        >{k}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Draw ── */}
            {activeTab === "draw" && (
              <div className="card animate-fade-in-up" style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 7 }}>
                    <PenTool size={15} color="var(--color-brand-500)" /> Vẽ Kanji
                  </h2>
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", background: "var(--color-border-light)", padding: "3px 10px", borderRadius: 9999 }}>{strokeCount} nét</span>
                </div>
                <div style={{ borderRadius: 14, overflow: "hidden", border: "2px solid var(--color-border)", background: "#f8fafc", marginBottom: 12, position: "relative" }}>
                  <canvas ref={canvasRef} width={340} height={280} style={{ display: "block", width: "100%", height: "auto", cursor: "crosshair", touchAction: "none" }} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
                  {strokeCount === 0 && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <div style={{ textAlign: "center", color: "#cbd5e1" }}>
                        <div style={{ fontSize: 64, fontFamily: "var(--font-jp)", lineHeight: 1, marginBottom: 8 }}>？</div>
                        <div style={{ fontSize: 12 }}>Vẽ kanji vào đây</div>
                      </div>
                    </div>
                  )}
                  {/* scanline effect */}
                  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", opacity: 0.03 }}>
                    <div style={{ position: "absolute", left: 0, right: 0, height: "30%", background: "linear-gradient(to bottom, transparent, #000, transparent)", animation: "scanline 3s linear infinite" }} />
                  </div>
                </div>
                {recognized && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "linear-gradient(135deg,#d1fae5,#ecfdf5)", border: "1px solid #6ee7b7", marginBottom: 12 }}>
                    <div style={{ fontSize: 40, fontFamily: "var(--font-jp)", fontWeight: 700, color: "#059669" }}>{recognized}</div>
                    <div>
                      <div style={{ fontSize: 12, color: "#065f46", fontWeight: 600 }}>Kết quả nhận diện</div>
                      <div style={{ fontSize: 11, color: "#6ee7b7" }}>Độ chính xác ~87%</div>
                    </div>
                    <button onClick={() => { const k = kanjiData.find(x => x.kanji === recognized); if (k) openDetail(k); }} style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 8, background: "#059669", color: "#fff", border: "none", fontSize: 12, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>Xem chi tiết</button>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-secondary" onClick={clearCanvas} style={{ flex: 1, justifyContent: "center" }}><Eraser size={14} /> Xóa</button>
                  <button className="btn-primary" onClick={handleRecognize} disabled={strokeCount === 0 || recognizing} style={{ flex: 1.5, justifyContent: "center", opacity: strokeCount === 0 ? 0.5 : 1 }}>
                    {recognizing ? <><div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite" }} /> Đang xử lý...</> : <><ScanLine size={14} /> Nhận diện</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Quick Detail ── */}
            {selectedKanji && !detailOpen && (
              <div className="card animate-fade-in-up" style={{ padding: 20, background: LEVEL_META[selectedKanji.level].bg, border: `1.5px solid ${LEVEL_META[selectedKanji.level].border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ width: 66, height: 66, borderRadius: 15, background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, fontFamily: "var(--font-jp)", fontWeight: 700, border: `1.5px solid ${LEVEL_META[selectedKanji.level].border}`, flexShrink: 0 }}>
                    {selectedKanji.kanji}
                  </div>
                  <div style={{ flex: 1, minWidth: 120 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: LEVEL_META[selectedKanji.level].color }}>{selectedKanji.meaning}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, fontFamily: "var(--font-jp)" }}>{selectedKanji.reading}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.8)", color: LEVEL_META[selectedKanji.level].color }}>{selectedKanji.level}</span>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.6)", color: "#64748b" }}>{selectedKanji.strokeCount} nét</span>
                    </div>
                  </div>
                  <button onClick={() => setDetailOpen(true)} style={{ padding: "8px 14px", borderRadius: 10, background: LEVEL_META[selectedKanji.level].color, color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                    Chi tiết <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Animated Mindmap (inline in left panel) ── */}
            <AnimatedMindmap />
          </div>

          {/* ═══ RIGHT PANEL ══════════════════════════ */}
          <div className="kanji-right-panel animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0, overflow: "hidden" }}>
            <div className="card" style={{ padding: "22px 22px 26px", maxWidth: "100%", overflow: "hidden" }}>

              {/* Header + level tabs */}
              <div className="kanji-right-header">
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 4, height: 20, borderRadius: 2, background: "linear-gradient(180deg,#6366f1,#06b6d4)", display: "inline-block" }} />
                  Khám phá Kanji theo trình độ
                </h2>
                <div className="level-tabs">
                  {LEVELS.map((lvl) => {
                    const lm = LEVEL_META[lvl];
                    const active = activeLevel === lvl;
                    return (
                      <button key={lvl} id={`level-tab-${lvl}`} onClick={() => setActiveLevel(lvl)} style={{
                        padding: "7px 16px", borderRadius: 9999, border: "none", cursor: "pointer",
                        fontWeight: active ? 700 : 500, fontSize: 12,
                        transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                        background: active ? lm.color : "var(--color-border-light)",
                        color: active ? "#fff" : "var(--color-text-secondary)",
                        boxShadow: active ? `0 4px 14px ${lm.glow}` : "none",
                        transform: active ? "scale(1.06) translateY(-1px)" : "scale(1)",
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        {lvl}{lvl !== "Bộ thủ" && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.75 }}>{lm.count}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Level info strip */}
              <div className="level-strip" style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                <div style={{ width: 4, height: 40, borderRadius: 4, background: meta.color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: meta.color }}>{activeLevel} — {meta.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{meta.count} {activeLevel === "Bộ thủ" ? "bộ thủ" : "kanji"} · Click để xem chi tiết</div>
                </div>
                <div className="level-strip-actions">
                  <button className="btn-secondary" style={{ padding: "7px 14px", fontSize: 12 }}><CreditCard size={13} /> Flashcard</button>
                  <button className="btn-secondary" style={{ padding: "7px 14px", fontSize: 12 }}><Pen size={13} /> Luyện viết</button>
                  <button className="btn-primary"   style={{ padding: "7px 14px", fontSize: 12 }}><Download  size={13} /> Tải file</button>
                </div>
              </div>

              {/* Kanji Grid */}
              <div className="kanji-grid">
                {displayItems.map((item, i) => {
                  const char    = "char"    in item ? item.char    : item.kanji;
                  const meaning = "meaning" in item ? item.meaning : "";
                  const reading = "reading" in item ? item.reading : "";
                  const isHov   = hoveredKanji === `${i}-${char}`;
                  return (
                    <button key={`${i}-${char}`}
                      className="kanji-card"
                      onMouseEnter={() => setHoveredKanji(`${i}-${char}`)}
                      onMouseLeave={() => setHoveredKanji(null)}
                      onClick={() => { if ("level" in item) openDetail(item); }}
                      title={`${char} – ${meaning}`}
                      style={{
                        border: isHov ? `2px solid ${meta.color}` : "1.5px solid var(--color-border)",
                        background: isHov ? meta.bg : "linear-gradient(145deg,#f8fafc,#f1f5f9)",
                        transform: isHov ? "translateY(-4px) scale(1.06)" : "scale(1)",
                        boxShadow: isHov ? `0 8px 20px ${meta.glow}` : "0 1px 3px rgba(0,0,0,0.04)",
                        animationDelay: `${(i % 20) * 0.02}s`,
                      }}
                    >
                      <span style={{ fontSize: 28, fontFamily: "var(--font-jp)", fontWeight: 700, lineHeight: 1, color: isHov ? meta.color : "var(--color-text-primary)", transition: "color 0.2s" }}>{char}</span>
                      {reading && <span style={{ fontSize: 8, color: isHov ? meta.color : "var(--color-text-muted)", fontFamily: "var(--font-jp)", lineHeight: 1, transition: "color 0.2s" }}>{reading.split("・")[0]}</span>}
                      <span style={{ fontSize: 8, color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.2, maxWidth: "90%", overflow: "hidden" }}>{meaning.slice(0, 6)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>


        {/* ── DETAIL MODAL ────────────────────────────── */}
        {detailOpen && selectedKanji && (
          <div className="modal-overlay" onClick={() => setDetailOpen(false)}>
            <div className="detail-modal-inner" onClick={(e) => e.stopPropagation()} style={{
              width: 500, maxWidth: "calc(100vw - 24px)", maxHeight: "90vh", overflowY: "auto",
              background: "var(--color-card-bg)", borderRadius: 26, padding: 34,
              boxShadow: `0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px ${LEVEL_META[selectedKanji.level].border}40`,
              border: `2px solid ${LEVEL_META[selectedKanji.level].border}`,
              display: "flex", flexDirection: "column", gap: 20,
              position: "relative", overflow: "hidden",
            }}>
              {/* Modal glow bg */}
              <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, borderRadius: "0 26px 0 100%", background: LEVEL_META[selectedKanji.level].bg, opacity: 0.4, pointerEvents: "none" }} />

              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18, flex: 1, minWidth: 0 }}>
                  <div className="detail-kanji-box" style={{
                    width: 100, height: 100, borderRadius: 22,
                    background: LEVEL_META[selectedKanji.level].bg,
                    border: `2px solid ${LEVEL_META[selectedKanji.level].border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 68, fontFamily: "var(--font-jp)", fontWeight: 700, flexShrink: 0,
                    boxShadow: `0 8px 24px ${LEVEL_META[selectedKanji.level].glow}`,
                  }}>
                    {selectedKanji.kanji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="detail-meaning" style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px" }}>{selectedKanji.meaning}</div>
                    <div style={{ fontSize: 14, color: "var(--color-text-secondary)", fontFamily: "var(--font-jp)", marginTop: 5 }}>{selectedKanji.reading}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                      <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: LEVEL_META[selectedKanji.level].bg, color: LEVEL_META[selectedKanji.level].color }}>{selectedKanji.level}</span>
                      <span style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, background: "var(--color-border-light)", color: "var(--color-text-secondary)" }}>{selectedKanji.strokeCount} nét</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setDetailOpen(false)} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--color-border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-secondary)", flexShrink: 0, transition: "all 0.18s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-border-light)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Readings */}
              <div className="detail-reading-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Âm On (音読み)", value: selectedKanji.onyomi,          icon: "🔊" },
                  { label: "Âm Kun (訓読み)", value: selectedKanji.kunyomi || "—", icon: "📖" },
                ].map((r) => (
                  <div key={r.label} style={{ padding: "14px 16px", borderRadius: 14, background: "var(--color-border-light)", border: "1px solid var(--color-border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{r.icon} {r.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-jp)", color: LEVEL_META[selectedKanji.level].color }}>{r.value}</div>
                  </div>
                ))}
              </div>

              {/* Stroke bar */}
              <div style={{ padding: "14px 16px", borderRadius: 14, background: "var(--color-border-light)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>Số nét</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: LEVEL_META[selectedKanji.level].color }}>{selectedKanji.strokeCount}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: Math.min(selectedKanji.strokeCount, 20) }).map((_, si) => (
                    <div key={si} style={{ height: 7, flex: 1, borderRadius: 4, background: LEVEL_META[selectedKanji.level].color, opacity: 0.25 + (si / selectedKanji.strokeCount) * 0.75, transition: `opacity 0.1s ${si * 0.03}s` }} />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="detail-actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                <button className="btn-secondary" style={{ justifyContent: "center", padding: "11px 8px" }}><Volume2 size={14} /> Phát âm</button>
                <button className="btn-secondary" style={{ justifyContent: "center", padding: "11px 8px" }}><Pen size={14} /> Luyện viết</button>
                <button className="btn-primary"   style={{ justifyContent: "center", padding: "11px 8px" }}><CreditCard size={14} /> Flashcard</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
