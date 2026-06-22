"use client";

import { useState } from "react";
import { Lock, BookOpen, ChevronRight, Star } from "lucide-react";
import { jlptLevelInfo } from "@/data/vocabulary";
import { useAppStore } from "@/lib/store";

export default function VocabularyPage() {
  const { isLoggedIn } = useAppStore();
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200 }}>
      {/* Hero */}
      <div
        className="card animate-fade-in-up"
        style={{
          padding: "48px 40px",
          marginBottom: 32,
          background: "linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #ec4899 100%)",
          border: "none",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* BG grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(#ffffff0a 1px, transparent 1px), linear-gradient(90deg, #ffffff0a 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Floating kanji */}
        {["語", "彙", "言", "葉", "詞"].map((k, i) => (
          <div
            key={k}
            style={{
              position: "absolute",
              fontSize: 64,
              fontFamily: "var(--font-jp)",
              fontWeight: 900,
              color: "rgba(255,255,255,0.05)",
              top: `${[10, 60, 20, 70, 40][i]}%`,
              left: `${[5, 85, 45, 15, 75][i]}%`,
              transform: "rotate(-15deg)",
              userSelect: "none",
            }}
          >
            {k}
          </div>
        ))}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div
              style={{
                padding: "6px 16px",
                borderRadius: 9999,
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              ✨ Phương pháp học từ vựng hiệu quả nhất
            </div>
          </div>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 900,
              color: "#fff",
              margin: "0 0 12px",
              letterSpacing: "-1px",
            }}
          >
            Học Bản Chất – Không Học Vẹt
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 17, margin: 0, maxWidth: 500, marginInline: "auto" }}>
            Không chỉ là nghĩa từ mà là cách dùng.
          </p>
        </div>
      </div>

      {/* JLPT Levels */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        📚 Từ vựng theo trình độ JLPT
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 20,
        }}
      >
        {jlptLevelInfo.map((info, i) => {
          const isLocked = !isLoggedIn && i > 1;
          const isHovered = hoveredLevel === info.level;

          return (
            <div
              key={info.level}
              className="card card-hover animate-fade-in-up"
              id={`vocab-level-${info.level.toLowerCase()}`}
              style={{
                height: 180,
                padding: "24px 28px",
                cursor: isLocked ? "default" : "pointer",
                position: "relative",
                overflow: "hidden",
                border: `1.5px solid ${isHovered && !isLocked ? info.color + "88" : "var(--color-border)"}`,
                animationDelay: `${i * 60}ms`,
              }}
              onMouseEnter={() => setHoveredLevel(info.level)}
              onMouseLeave={() => setHoveredLevel(null)}
            >
              {/* Decorative circle */}
              <div
                style={{
                  position: "absolute",
                  right: -20,
                  top: -20,
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  background: info.color + "15",
                  border: `2px solid ${info.color}22`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 20,
                  bottom: -10,
                  fontSize: 60,
                  fontFamily: "var(--font-jp)",
                  fontWeight: 900,
                  color: info.color + "18",
                  userSelect: "none",
                }}
              >
                語
              </div>

              {/* Lock overlay */}
              {isLocked && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.45)",
                    backdropFilter: "blur(3px)",
                    borderRadius: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    zIndex: 2,
                  }}
                >
                  <Lock size={24} color="#fff" />
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Đăng nhập để mở khóa</span>
                </div>
              )}

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: info.color,
                    }}
                  >
                    {info.level}
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: 5 - ["N5","N4","N3","N2","N1"].indexOf(info.level) }).map((_, si) => (
                      <Star key={si} size={12} color={info.color} fill={info.color} />
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
                  {info.count.toLocaleString()}
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)", marginLeft: 4 }}>từ vựng</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{info.description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 12, color: info.color }}>
                  <BookOpen size={13} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Bắt đầu học</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
