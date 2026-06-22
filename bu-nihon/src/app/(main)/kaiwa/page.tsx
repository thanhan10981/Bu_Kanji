"use client";

import { kaiwaCards } from "@/data/misc";
import { MessageSquare, ChevronRight } from "lucide-react";

const levelColors: Record<string, string> = {
  N5: "#10b981", N4: "#3b82f6", N3: "#f59e0b", N2: "#ef4444", N1: "#8b5cf6",
};
const levelBg: Record<string, string> = {
  N5: "#d1fae5", N4: "#dbeafe", N3: "#fef3c7", N2: "#fee2e2", N1: "#ede9fe",
};

export default function KaiwaPage() {
  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200 }}>
      {/* Hero */}
      <div
        className="card animate-fade-in-up"
        style={{
          padding: "48px 40px",
          marginBottom: 32,
          background: "linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 40%, #4c1d95 100%)",
          border: "none",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Speech bubbles deco */}
        {[
          { text: "こんにちは！", top: "15%", left: "8%", size: 14 },
          { text: "よろしく！", top: "60%", left: "5%", size: 12 },
          { text: "ありがとう", top: "20%", right: "6%", size: 13 },
          { text: "すみません", top: "65%", right: "8%", size: 12 },
        ].map((bubble, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: bubble.top,
              left: bubble.left,
              right: bubble.right,
              padding: "6px 12px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.5)",
              fontSize: bubble.size,
              fontFamily: "var(--font-jp)",
              backdropFilter: "blur(4px)",
              whiteSpace: "nowrap",
            }}
          >
            {bubble.text}
          </div>
        ))}

        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "2px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginInline: "auto",
              marginBottom: 16,
            }}
          >
            <MessageSquare size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "#fff", margin: "0 0 10px", letterSpacing: "-1px" }}>
            🎭 Nhập vai Kaiwa
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, margin: 0 }}>
            Luyện hội thoại qua các tình huống thực tế
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>📚 Các chủ đề hội thoại</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {kaiwaCards.map((card, i) => (
          <div
            key={card.id}
            id={`kaiwa-card-${card.id}`}
            className="card card-hover animate-fade-in-up"
            style={{
              height: 180,
              overflow: "hidden",
              cursor: "pointer",
              position: "relative",
              animationDelay: `${i * 60}ms`,
            }}
          >
            {/* Gradient background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(135deg, ${levelColors[card.level]}22, ${levelColors[card.level]}08)`,
              }}
            />

            {/* Deco kanji */}
            <div
              style={{
                position: "absolute",
                right: -10,
                bottom: -10,
                fontSize: 80,
                fontFamily: "var(--font-jp)",
                color: levelColors[card.level] + "12",
                fontWeight: 900,
                userSelect: "none",
              }}
            >
              話
            </div>

            <div style={{ position: "relative", padding: "20px 22px", height: "100%", display: "flex", flexDirection: "column" }}>
              {/* Topic + level */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "var(--color-card-bg)",
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {card.topic}
                </div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: levelBg[card.level],
                    color: levelColors[card.level],
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {card.level}
                </span>
              </div>

              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>{card.lesson}</div>
              <div style={{ fontSize: 17, fontWeight: 700, flex: 1, lineHeight: 1.4 }}>{card.title}</div>

              <div style={{ display: "flex", alignItems: "center", gap: 4, color: levelColors[card.level] }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Bắt đầu nhập vai</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
