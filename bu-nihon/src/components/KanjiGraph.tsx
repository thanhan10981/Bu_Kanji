"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export interface KanjiNode {
  id: string;
  kanji: string;
  meaning: string;
  reading: string;
  /** "blue" | "orange" | "green" | "purple" | hex string */
  color: "blue" | "orange" | "green" | "purple" | string;
  x: number;
  y: number;
}

export interface KanjiEdge {
  from: string;
  to: string;
}

interface KanjiGraphProps {
  nodes: KanjiNode[];
  edges: KanjiEdge[];
  width?: number;
  height?: number;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Color palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const COLOR_MAP: Record<string, { fill: string; stroke: string; text: string; glow: string }> = {
  blue:   { fill: "#38bdf8", stroke: "#0369a1", text: "#0c4a6e", glow: "rgba(56,189,248,0.35)" },
  orange: { fill: "#fb923c", stroke: "#c2410c", text: "#431407", glow: "rgba(251,146,60,0.35)" },
  green:  { fill: "#34d399", stroke: "#047857", text: "#064e3b", glow: "rgba(52,211,153,0.35)" },
  purple: { fill: "#a78bfa", stroke: "#5b21b6", text: "#2e1065", glow: "rgba(167,139,250,0.35)" },
};

function resolveColor(c: string) {
  return COLOR_MAP[c] ?? { fill: c, stroke: c, text: "#fff", glow: `${c}55` };
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Arrow utils â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const RADIUS = 36;

function getArrowPoints(
  ax: number, ay: number,
  bx: number, by: number
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = bx - ax, dy = by - ay;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  return {
    x1: ax + ux * RADIUS,
    y1: ay + uy * RADIUS,
    x2: bx - ux * (RADIUS + 4),
    y2: by - uy * (RADIUS + 4),
  };
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Tooltip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface TooltipState { nodeId: string; x: number; y: number }

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ KanjiGraph â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function KanjiGraph({
  nodes: initialNodes,
  edges,
  width = 700,
  height = 420,
}: KanjiGraphProps) {
  const [nodes, setNodes] = useState<KanjiNode[]>(() =>
    initialNodes.map(n => ({ ...n }))
  );
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1); // 1 = 100%

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Drag state
  const dragging = useRef<{ id: string; ox: number; oy: number; mx: number; my: number } | null>(null);

  /* â”€â”€ Zoom viewport (viewBox that shrinks when zoomed in) â”€â”€ */
  const vbW = width / zoom;
  const vbH = height / zoom;
  const vbX = (width  - vbW) / 2;
  const vbY = (height - vbH) / 2;

  /* â”€â”€ Scale for responsive SVG â”€â”€ */
  const [svgScale, setSvgScale] = useState(1);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setSvgScale(el.clientWidth / width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [width]);

  /* â”€â”€ Scroll-to-zoom â”€â”€ */
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setZoom(z => {
        const delta = e.deltaY > 0 ? -0.12 : 0.12;
        return Math.min(3, Math.max(0.3, +(z + delta).toFixed(2)));
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  /* â”€â”€ Drag handlers â”€â”€ */
  const onPointerDown = useCallback((e: React.PointerEvent<SVGGElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const node = nodes.find(n => n.id === id)!;
    dragging.current = { id, ox: node.x, oy: node.y, mx: e.clientX, my: e.clientY };
    (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
    setTooltip(null);
  }, [nodes]);

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging.current || !svgRef.current) return;
    const { id, ox, oy, mx, my } = dragging.current;
    const rect = svgRef.current.getBoundingClientRect();
    // Scale accounts for both element size AND zoom level
    const scaleX = vbW / rect.width;
    const scaleY = vbH / rect.height;
    const nx = Math.max(RADIUS + 2, Math.min(width  - RADIUS - 2, ox + (e.clientX - mx) * scaleX));
    const ny = Math.max(RADIUS + 2, Math.min(height - RADIUS - 2, oy + (e.clientY - my) * scaleY));
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x: nx, y: ny } : n));
  }, [vbW, vbH, width, height]);

  const onPointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  /* â”€â”€ Reset layout â”€â”€ */
  const handleReset = () => {
    setNodes(initialNodes.map(n => ({ ...n })));
    setTooltip(null);
    setZoom(1);
  };

  /* â”€â”€ Fullscreen â”€â”€ */
  const handleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* â”€â”€ Export SVG â”€â”€ */
  const handleExport = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "kanji-graph.svg"; a.click();
    URL.revokeObjectURL(url);
  };

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <>
      <style>{`
        @keyframes kg-dash { to { stroke-dashoffset: -22; } }
        @keyframes kg-fade-in { from { opacity:0; transform:scale(0.85) translateY(-4px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .kg-node { transition: filter 0.18s; }
        .kg-node:hover { filter: brightness(1.08); }
        .kg-node-circle {
          transition: r 0.18s cubic-bezier(0.34,1.56,0.64,1), stroke-width 0.15s;
        }
        .kg-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 13px; border-radius: 8px; font-size: 12px; font-weight: 600;
          border: 1px solid #e2e8f0; background: white; cursor: pointer;
          color: #475569; transition: all 0.15s ease;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .kg-btn:hover { background: #f8fafc; border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .kg-btn-primary {
          background: linear-gradient(135deg,#6366f1,#4f46e5);
          color: white; border-color: transparent;
          box-shadow: 0 2px 10px rgba(99,102,241,0.3);
        }
        .kg-btn-primary:hover { filter: brightness(1.08); box-shadow: 0 4px 16px rgba(99,102,241,0.4); }
        .kg-tooltip {
          position: absolute; pointer-events: none;
          background: rgba(15,23,42,0.92); color: white;
          padding: 7px 11px; border-radius: 9px; font-size: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.28);
          animation: kg-fade-in 0.15s ease both;
          z-index: 100; white-space: nowrap;
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255,255,255,0.08);
        }
      `}</style>

      <div
        ref={containerRef}
        style={{
          position: "relative",
          background: "linear-gradient(145deg,#f8faff,#f1f5fb)",
          borderRadius: 20,
          border: "1.5px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          userSelect: "none",
        }}
      >
        {/* â”€â”€ Dot grid bg â”€â”€ */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          aria-hidden
        >
          <defs>
            <pattern id="kg-dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="11" cy="11" r="1.1" fill="#dbe4f0" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kg-dots)" />
        </svg>

        {/* â”€â”€ Toolbar â”€â”€ */}
        <div style={{
          position: "relative", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #edf2f7",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: "linear-gradient(180deg,#6366f1,#38bdf8)" }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>SÆ¡ Ä‘á»“ Kanji</span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: "#64748b",
              background: "#f1f5f9", border: "1px solid #e2e8f0",
              padding: "2px 8px", borderRadius: 999,
            }}>
              {nodes.length} node Â· {edges.length} liÃªn káº¿t
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="kg-btn" onClick={handleReset} title="Reset layout">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M2 8a6 6 0 1 1 1.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M2 12V8h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Reset
            </button>
            <button className="kg-btn" onClick={handleExport} title="Export SVG">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Export
            </button>
            <button className="kg-btn kg-btn-primary" onClick={handleFullscreen} title="Fullscreen">
              {isFullscreen ? (
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M5 1H1v4M11 1h4v4M5 15H1v-4M11 15h4v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M1 5V1h4M11 1h4v4M15 11v4h-4M5 15H1v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {isFullscreen ? "Thu nhá»" : "ToÃ n mÃ n hÃ¬nh"}
            </button>
          </div>
        </div>

        {/* â”€â”€ SVG Canvas â”€â”€ */}
        <div style={{ position: "relative" }}>
          {/* Zoom controls */}
          <div style={{
            position: "absolute", bottom: 12, right: 12, zIndex: 20,
            display: "flex", flexDirection: "column", gap: 3, alignItems: "center",
          }}>
            <button
              onClick={() => setZoom(z => Math.min(3, +(z + 0.2).toFixed(2)))}
              title="PhÃ³ng to"
              style={{
                width: 30, height: 30, borderRadius: 8, border: "1.5px solid #e2e8f0",
                background: "rgba(255,255,255,0.95)", cursor: "pointer",
                fontSize: 18, fontWeight: 700, color: "#475569",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)", lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.background = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "rgba(255,255,255,0.95)"; }}
            >+</button>
            <div style={{
              width: 30, height: 24, borderRadius: 6,
              background: "rgba(255,255,255,0.9)", border: "1.5px solid #e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 800, color: "#64748b",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>{Math.round(zoom * 100)}%</div>
            <button
              onClick={() => setZoom(z => Math.max(0.3, +(z - 0.2).toFixed(2)))}
              title="Thu nhá»"
              style={{
                width: 30, height: 30, borderRadius: 8, border: "1.5px solid #e2e8f0",
                background: "rgba(255,255,255,0.95)", cursor: "pointer",
                fontSize: 20, fontWeight: 700, color: "#475569", lineHeight: 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#94a3b8"; e.currentTarget.style.background = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "rgba(255,255,255,0.95)"; }}
            >âˆ’</button>
            {zoom !== 1 && (
              <button
                onClick={() => setZoom(1)}
                title="Reset zoom"
                style={{
                  width: 30, height: 22, borderRadius: 6, border: "1.5px solid #c7d2fe",
                  background: "rgba(238,242,255,0.95)", cursor: "pointer",
                  fontSize: 8, fontWeight: 800, color: "#4f46e5",
                  boxShadow: "0 1px 4px rgba(99,102,241,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >100%</button>
            )}
          </div>

          <svg
            ref={svgRef}
            width="100%"
            viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{
              display: "block",
              cursor: dragging.current ? "grabbing" : "default",
              touchAction: "none",
              minHeight: 300,
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <defs>
              {/* Arrow markers per edge color */}
              {edges.map((edge, i) => {
                const fromNode = nodeMap[edge.from];
                const toNode   = nodeMap[edge.to];
                if (!fromNode || !toNode) return null;
                const fromCol = resolveColor(fromNode.color);
                return (
                  <marker
                    key={`marker-${i}`}
                    id={`kg-arrow-${i}`}
                    markerWidth="10" markerHeight="10"
                    refX="8" refY="3.5" orient="auto"
                  >
                    <path d="M0,0 L0,7 L10,3.5 z" fill={fromCol.stroke} opacity="0.85" />
                  </marker>
                );
              })}
              {/* Glow filters */}
              {["blue","orange","green","purple"].map(c => {
                const col = resolveColor(c);
                return (
                  <filter key={`glow-${c}`} id={`kg-glow-${c}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                );
              })}
            </defs>

            {/* â”€â”€ Edges â”€â”€ */}
            {edges.map((edge, i) => {
              const from = nodeMap[edge.from];
              const to   = nodeMap[edge.to];
              if (!from || !to) return null;
              const { x1, y1, x2, y2 } = getArrowPoints(from.x, from.y, to.x, to.y);
              const fromCol = resolveColor(from.color);
              const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
              return (
                <g key={`edge-${i}`}>
                  {/* Shadow/glow line */}
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={fromCol.stroke} strokeWidth="6" opacity="0.08"
                    style={{ filter: "blur(3px)" }}
                  />
                  {/* Main dashed line */}
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={fromCol.stroke}
                    strokeWidth="2.5"
                    strokeDasharray="8 5"
                    strokeLinecap="round"
                    opacity="0.85"
                    markerEnd={`url(#kg-arrow-${i})`}
                    style={{ animationName: "kg-dash", animationDuration: "0.8s", animationTimingFunction: "linear", animationIterationCount: "infinite", animationDelay: `${i * 0.2}s` }}
                  />
                  {/* Mid dot */}
                  <circle
                    cx={(x1+x2)/2} cy={(y1+y2)/2} r="3.5"
                    fill={fromCol.fill} stroke={fromCol.stroke} strokeWidth="1.5"
                    opacity="0.9"
                  />
                </g>
              );
            })}

            {/* â”€â”€ Nodes â”€â”€ */}
            {nodes.map((node) => {
              const col = resolveColor(node.color);
              const isHovered = tooltip?.nodeId === node.id;
              return (
                <g
                  key={node.id}
                  className="kg-node"
                  transform={`translate(${node.x},${node.y})`}
                  style={{ cursor: "grab" }}
                  onPointerDown={e => onPointerDown(e, node.id)}
                  onPointerEnter={e => {
                    if (dragging.current) return;
                    const svg = svgRef.current;
                    if (!svg) return;
                    const rect = svg.getBoundingClientRect();
                    const scaleX = rect.width / width;
                    const scaleY = rect.height / height;
                    setTooltip({
                      nodeId: node.id,
                      x: node.x * scaleX,
                      y: node.y * scaleY,
                    });
                  }}
                  onPointerLeave={() => setTooltip(null)}
                >
                  {/* Outer glow ring */}
                  <circle
                    r={isHovered ? RADIUS + 12 : RADIUS + 6}
                    fill={col.fill} opacity={isHovered ? 0.22 : 0.12}
                    style={{ transition: "r 0.2s, opacity 0.2s" }}
                  />
                  {/* Shadow */}
                  <circle r={RADIUS + 2} fill="rgba(0,0,0,0.12)" transform="translate(2,5)"
                    style={{ filter: "blur(6px)" }}
                  />
                  {/* Main circle */}
                  <circle
                    className="kg-node-circle"
                    r={isHovered ? RADIUS + 3 : RADIUS}
                    fill={col.fill}
                    stroke={col.stroke}
                    strokeWidth={isHovered ? 4 : 3}
                    style={{
                      filter: isHovered ? `drop-shadow(0 0 12px ${col.glow})` : "none",
                    }}
                  />
                  {/* Gloss */}
                  <ellipse cx="-9" cy="-14" rx="15" ry="10" fill="rgba(255,255,255,0.38)" />
                  {/* Kanji */}
                  <text
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={RADIUS * 0.9}
                    fontFamily="var(--font-jp, 'Noto Serif JP', serif)"
                    fontWeight="900"
                    fill={col.text}
                    style={{ userSelect: "none", textShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
                  >
                    {node.kanji}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* â”€â”€ Tooltip â”€â”€ */}
          {tooltip && (() => {
            const node = nodes.find(n => n.id === tooltip.nodeId);
            if (!node) return null;
            const col = resolveColor(node.color);
            return (
              <div
                className="kg-tooltip"
                style={{
                  left: tooltip.x + RADIUS * (svgScale) + 10,
                  top:  tooltip.y - 24,
                  borderLeft: `3px solid ${col.fill}`,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, color: col.fill, marginBottom: 2 }}>
                  {node.meaning}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-jp, serif)" }}>
                  {node.reading}
                </div>
              </div>
            );
          })()}
        </div>

        {/* â”€â”€ Footer hint â”€â”€ */}
        <div style={{
          padding: "8px 16px",
          borderTop: "1px solid #edf2f7",
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 11, color: "#94a3b8",
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <circle cx="6" cy="6" r="5" fill="none" stroke="#94a3b8" strokeWidth="1.2"/>
            <path d="M6 3.5v5M3.5 6h5" stroke="#94a3b8" strokeWidth="1.2"/>
          </svg>
          KÃ©o tháº£ node Ä‘á»ƒ sáº¯p xáº¿p Â· Hover Ä‘á»ƒ xem nghÄ©a Â· MÅ©i tÃªn tá»« thÃ nh pháº§n vá» Kanji chÃ­nh
        </div>
      </div>
    </>
  );
}

