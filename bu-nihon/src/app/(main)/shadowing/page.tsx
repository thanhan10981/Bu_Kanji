"use client";

import { useState } from "react";
import { Mic, Eye, Lock, Play, Clock, Users } from "lucide-react";
import { shadowingVideos } from "@/data/misc";

const categories = ["Tất cả", "Chuyện cổ tích", "Tin tức", "Anime", "JLPT"] as const;
type Category = (typeof categories)[number];

const levelColors: Record<string, string> = {
  N5: "#10b981", N4: "#3b82f6", N3: "#f59e0b", N2: "#ef4444", N1: "#8b5cf6",
};

const levelBg: Record<string, string> = {
  N5: "#d1fae5", N4: "#dbeafe", N3: "#fef3c7", N2: "#fee2e2", N1: "#ede9fe",
};

const categoryEmoji: Record<string, string> = {
  "Chuyện cổ tích": "📖",
  "Tin tức": "📰",
  "Anime": "🎌",
  "JLPT": "📝",
};

export default function ShadowingPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("Tất cả");

  const filtered = shadowingVideos.filter(
    (v) => activeCategory === "Tất cả" || v.category === activeCategory
  );

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200 }}>
      {/* Hero */}
      <div
        className="card animate-fade-in-up"
        style={{
          padding: "48px 40px",
          marginBottom: 32,
          background: "linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 50%, #312e81 100%)",
          border: "none",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(ellipse at 30% 50%, rgba(16,185,129,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.15) 0%, transparent 60%)",
          }}
        />
        {/* Sound waves decoration */}
        {[40, 60, 80, 60, 40].map((h, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              bottom: 20,
              left: `${20 + i * 15}%`,
              width: 3,
              height: h,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 9999,
              transform: "translateX(-50%)",
            }}
          />
        ))}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "2px solid rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mic size={28} color="#fff" />
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#fff", margin: "0 0 10px", letterSpacing: "-1px" }}>
            Shadowing & Chép chính tả
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, margin: 0 }}>
            Luyện nghe, nói và bắt chước người bản xứ
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            id={`shadow-filter-${cat.toLowerCase().replace(/\s/g, "-")}`}
            className={`tab-item ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
            style={{ fontSize: 13 }}
          >
            {cat !== "Tất cả" && categoryEmoji[cat] + " "}
            {cat}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
        {filtered.map((video, i) => (
          <div
            key={video.id}
            className="card card-hover animate-fade-in-up"
            id={`shadowing-video-${video.id}`}
            style={{ overflow: "hidden", animationDelay: `${i * 60}ms`, cursor: "pointer" }}
          >
            {/* Thumbnail */}
            <div
              style={{
                height: 160,
                background: `linear-gradient(135deg, ${levelColors[video.level]}33, ${levelColors[video.level]}66)`,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Play button */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                }}
              >
                <Play size={22} color={levelColors[video.level]} style={{ marginLeft: 2 }} fill={levelColors[video.level]} />
              </div>

              {/* Duration badge */}
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  right: 10,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Clock size={10} />
                {video.duration}
              </div>

              {/* Level badge */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  padding: "3px 8px",
                  borderRadius: 6,
                  background: levelBg[video.level],
                  color: levelColors[video.level],
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {video.level}
              </div>

              {/* Premium lock */}
              {video.isPremium && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    backdropFilter: "blur(2px)",
                  }}
                >
                  <Lock size={22} color="#fbbf24" />
                  <span style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700 }}>Premium</span>
                </div>
              )}
            </div>

            {/* Card content */}
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, lineHeight: 1.4 }}>{video.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--color-text-muted)", fontSize: 12, marginBottom: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Users size={11} />
                  {video.views.toLocaleString()}
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#f3f4f6",
                    color: "var(--color-text-secondary)",
                    fontSize: 11,
                  }}
                >
                  {categoryEmoji[video.category]} {video.category}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-secondary" style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "8px 12px" }}>
                  <Eye size={13} />
                  Dictation
                </button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: 12, padding: "8px 12px" }}>
                  <Mic size={13} />
                  Shadowing
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
