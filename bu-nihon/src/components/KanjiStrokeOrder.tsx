"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface KanjiStrokeOrderProps {
  kanji: string;
  color?: string;
  width?: number;
  height?: number;
}

type Status =
  | "loading"          // hanzi-writer loading
  | "ready"            // hanzi-writer ready
  | "kanjivg-loading"  // fetching KanjiVG SVG
  | "kanjivg-ready"    // KanjiVG SVG loaded
  | "error";           // all sources failed

/* CDN list for KanjiVG — tried in order */
const KANJIVG_URLS = (hex: string) => [
  `https://cdn.jsdelivr.net/npm/kanjivg@20220427/kanji/${hex}.svg`,
  `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${hex}.svg`,
  `https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${hex}.svg`,
];

async function fetchKanjiVG(hex: string): Promise<string> {
  const urls = KANJIVG_URLS(hex);
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: "force-cache" });
      if (r.ok) return await r.text();
    } catch {
      // try next
    }
  }
  throw new Error("KanjiVG not found");
}

/** Style a raw KanjiVG SVG: recolor strokes, add stroke number labels */
function styleKanjiVgSvg(raw: string, color: string, size: number): string {
  // Parse the SVG to extract and style
  let svg = raw
    // Remove fixed width/height so it scales fluidly
    .replace(/width="[^"]*"/, `width="${size}"`)
    .replace(/height="[^"]*"/, `height="${size}"`)
    // Color all stroke paths
    .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
    // Style fill for any filled elements (numbers etc)
    .replace(/fill="#[0-9a-fA-F]+"/g, `fill="${color}"`)
    // Make viewBox explicit if missing
    .replace(/<svg /, `<svg viewBox="0 0 109 109" style="display:block;width:100%;height:auto;max-height:${size}px;" `);

  return svg;
}

export default function KanjiStrokeOrder({
  kanji,
  color = "#059669",
  width = 280,
  height = 280,
}: KanjiStrokeOrderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<unknown>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [isAnimating, setIsAnimating] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [currentStroke, setCurrentStroke] = useState(0);
  const [kanjivgSvg, setKanjivgSvg] = useState<string | null>(null);

  const hex = kanji.codePointAt(0)?.toString(16).padStart(5, "0") ?? "";

  /* ── KanjiVG fallback ── */
  const tryKanjiVG = useCallback(
    (cancelled: { v: boolean }) => {
      setStatus("kanjivg-loading");
      fetchKanjiVG(hex)
        .then((raw) => {
          if (cancelled.v) return;
          setKanjivgSvg(styleKanjiVgSvg(raw, color, height));
          setStatus("kanjivg-ready");
        })
        .catch(() => {
          if (!cancelled.v) setStatus("error");
        });
    },
    [hex, color, height]
  );

  /* ── Hanzi Writer init ── */
  useEffect(() => {
    if (!containerRef.current) return;
    const cancelled = { v: false };

    containerRef.current.innerHTML = "";
    setStatus("loading");
    setIsAnimating(false);
    setCurrentStroke(0);
    setStrokeCount(0);
    setKanjivgSvg(null);

    import("hanzi-writer")
      .then((mod) => {
        if (cancelled.v || !containerRef.current) return;
        const HW = (mod.default ?? mod) as { create: Function };

        try {
          const w = HW.create(containerRef.current, kanji, {
            width,
            height,
            padding: 18,
            showOutline: true,
            strokeColor: "#1e293b",
            outlineColor: "#dde3ef",
            radicalColor: color,
            drawingColor: color,
            showCharacter: true,
            strokeAnimationSpeed: 1.1,
            delayBetweenStrokes: 220,
            onLoadCharDataSuccess: (data: { strokes: unknown[] }) => {
              if (!cancelled.v) {
                setStatus("ready");
                setStrokeCount(data.strokes.length);
              }
            },
            onLoadCharDataError: () => {
              // Hanzi Writer has no data → try KanjiVG
              if (!cancelled.v) tryKanjiVG(cancelled);
            },
          });
          writerRef.current = w;
        } catch {
          if (!cancelled.v) tryKanjiVG(cancelled);
        }
      })
      .catch(() => {
        if (!cancelled.v) tryKanjiVG(cancelled);
      });

    return () => { cancelled.v = true; };
  }, [kanji, color, width, height, tryKanjiVG]);

  /* ── Hanzi Writer controls ── */
  const playAll = () => {
    if (!writerRef.current || isAnimating || status !== "ready") return;
    setIsAnimating(true);
    setCurrentStroke(0);
    (writerRef.current as { animateCharacter: Function }).animateCharacter({
      onComplete: () => { setIsAnimating(false); setCurrentStroke(strokeCount); },
    });
  };

  const nextStroke = () => {
    if (!writerRef.current || isAnimating || status !== "ready" || currentStroke >= strokeCount) return;
    setIsAnimating(true);
    (writerRef.current as { animateStroke: Function }).animateStroke(currentStroke, {
      onComplete: () => { setIsAnimating(false); setCurrentStroke((s) => s + 1); },
    });
  };

  const reset = () => {
    if (!writerRef.current) return;
    (writerRef.current as { hideCharacter: Function }).hideCharacter();
    setCurrentStroke(0);
    setIsAnimating(false);
  };

  const isLoading = status === "loading" || status === "kanjivg-loading";

  /* ── Render ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Main canvas */}
      <div style={{
        position: "relative", borderRadius: 16,
        border: "1.5px solid #e2e8f0",
        background: "#fff",
        overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        minHeight: Math.min(height, 260) + 16,
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      }}>
        {/* Spinner */}
        {isLoading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "#fff", zIndex: 2 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${color}25`, borderTopColor: color, animationName: "kso-spin", animationDuration: "0.7s", animationTimingFunction: "linear", animationIterationCount: "infinite" }} />
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
              {status === "kanjivg-loading" ? "Đang tải từ KanjiVG…" : "Đang tải Hanzi Writer…"}
            </div>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div style={{ padding: "28px 20px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>✏️</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>Không có dữ liệu nét</div>
            <div style={{ fontSize: 10, marginTop: 3, color: "#cbd5e1" }}>{kanji} · U+{hex?.toUpperCase()}</div>
          </div>
        )}

        {/* KanjiVG static SVG */}
        {status === "kanjivg-ready" && kanjivgSvg && (
          <div style={{ width: "100%", padding: "12px 16px 8px" }}>
            <div
              dangerouslySetInnerHTML={{ __html: kanjivgSvg }}
              style={{ width: "100%", lineHeight: 0 }}
            />
            {/* Source badge */}
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 10, color: "#94a3b8" }}>
              <span style={{ background: `${color}15`, color, border: `1px solid ${color}40`, padding: "1px 7px", borderRadius: 4, fontWeight: 700, fontSize: 9 }}>KanjiVG</span>
              <span>Thứ tự nét · Nguồn mở</span>
            </div>
          </div>
        )}

        {/* Hanzi Writer canvas */}
        <div
          ref={containerRef}
          style={{ lineHeight: 0, display: status === "ready" ? "block" : "none" }}
        />

        {/* Stroke progress badge (Hanzi Writer mode) */}
        {status === "ready" && strokeCount > 0 && (
          <div style={{ position: "absolute", top: 10, right: 10, background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 8, padding: "3px 9px", fontSize: 10, fontWeight: 800, color }}>
            {currentStroke}/{strokeCount} nét
          </div>
        )}
      </div>

      {/* Hanzi Writer controls */}
      {status === "ready" && (
        <>
          <div style={{ display: "flex", gap: 6 }}>
            {/* Play all */}
            <button
              onClick={playAll}
              disabled={isAnimating}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", borderRadius: 10, border: `1.5px solid ${color}55`, background: isAnimating ? `${color}08` : `${color}15`, color: isAnimating ? "#94a3b8" : color, fontWeight: 700, fontSize: 12, cursor: isAnimating ? "not-allowed" : "pointer", transition: "all 0.15s" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              {isAnimating ? "Đang chạy…" : "Phát tất cả nét"}
            </button>

            {/* Next stroke */}
            <button
              onClick={nextStroke}
              disabled={isAnimating || currentStroke >= strokeCount}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "9px 13px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: (isAnimating || currentStroke >= strokeCount) ? "#94a3b8" : "#475569", fontWeight: 700, fontSize: 12, cursor: (isAnimating || currentStroke >= strokeCount) ? "not-allowed" : "pointer", transition: "all 0.15s" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              Nét tiếp
            </button>

            {/* Reset */}
            <button
              onClick={reset}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "9px 11px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "white", color: "#94a3b8", cursor: "pointer", transition: "all 0.15s" }}
              title="Xóa & bắt đầu lại"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M2 8a6 6 0 1 1 1.5 4" /><path d="M2 12V8h4" strokeLinejoin="round" /></svg>
            </button>
          </div>

          {/* Stroke number dots */}
          {strokeCount > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {Array.from({ length: strokeCount }).map((_, i) => (
                <div key={i}
                  style={{
                    width: 22, height: 22, borderRadius: 6, fontSize: 9, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: i < currentStroke ? color : `${color}15`,
                    border: `1.5px solid ${i < currentStroke ? color : `${color}35`}`,
                    color: i < currentStroke ? "white" : color,
                    transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                    transform: i === currentStroke - 1 ? "scale(1.18)" : "scale(1)",
                  }}>
                  {i + 1}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes kso-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
