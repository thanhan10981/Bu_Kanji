"use client";


import { BookOpen, ChevronRight } from "lucide-react";

const legendItems = [
  { badge: "N", label: "Danh từ", color: "#3b82f6", bg: "#dbeafe" },
  { badge: "V", label: "Động từ", color: "#10b981", bg: "#d1fae5" },
  { badge: "A", label: "Tính từ", color: "#f59e0b", bg: "#fef3c7" },
  { badge: "Aい", label: "Tính từ い", color: "#ef4444", bg: "#fee2e2" },
  { badge: "Aな", label: "Tính từ な", color: "#8b5cf6", bg: "#ede9fe" },
  { badge: "S", label: "Câu", color: "#06b6d4", bg: "#cffafe" },
];

const minnaBooks = [
  { level: "N5", lessons: 25, progress: 0, color: "#10b981" },
  { level: "N4", lessons: 25, progress: 0, color: "#3b82f6" },
];

const shinkanzenBooks = [
  { level: "N3", lessons: 20, progress: 0, color: "#f59e0b" },
  { level: "N2", lessons: 20, progress: 0, color: "#ef4444" },
  { level: "N1", lessons: 20, progress: 0, color: "#8b5cf6" },
];

export default function GrammarPage() {


  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200 }}>
      {/* Hero */}
      <div
        className="card animate-fade-in-up"
        style={{
          padding: "48px 40px",
          marginBottom: 32,
          background: "linear-gradient(135deg, #064e3b 0%, #1e40af 60%, #4c1d95 100%)",
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
            backgroundImage: "radial-gradient(circle at 20% 50%, #10b98120 0%, transparent 60%), radial-gradient(circle at 80% 50%, #8b5cf620 0%, transparent 60%)",
          }}
        />
        <div style={{ position: "relative" }}>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#fff", margin: "0 0 10px", letterSpacing: "-1px" }}>
            🧩 JLPT Mindmap
          </h1>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", margin: 0 }}>
            Càng học càng cuốn
          </p>

          {/* Mindmap visual */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 32, flexWrap: "wrap" }}>
            {["N5", "N4", "N3", "N2", "N1"].map((level, i) => {
              const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
              return (
                <div key={level} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: `${52 + i * 8}px`,
                      height: `${52 + i * 8}px`,
                      borderRadius: "50%",
                      background: colors[i] + "20",
                      border: `2px solid ${colors[i]}60`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: colors[i],
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    {level}
                  </div>
                  {i < 4 && (
                    <div style={{ width: 24, height: 2, background: "rgba(255,255,255,0.2)", borderRadius: 9999 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🏷 Ký hiệu ngữ pháp</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {legendItems.map((item) => (
            <div
              key={item.badge}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 9999,
                background: "var(--color-card-bg)",
                border: "1px solid var(--color-border)",
              }}
            >
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: item.bg,
                  color: item.color,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {item.badge}
              </span>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Minna No Nihongo */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #1e40af, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Minna No Nihongo</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>みんなの日本語</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {minnaBooks.map((book, i) => (
            <BookCard key={book.level} book={book} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* Shinkanzen */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Shinkanzen Master</h2>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>新完全マスター</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {shinkanzenBooks.map((book, i) => (
            <BookCard key={book.level} book={book} delay={i * 60} />
          ))}
        </div>
      </section>
    </div>
  );
}

function BookCard({
  book,
  delay,
}: {
  book: { level: string; lessons: number; progress: number; color: string };
  delay: number;
}) {
  const bgColors: Record<string, string> = {
    N5: "#d1fae5", N4: "#dbeafe", N3: "#fef3c7", N2: "#fee2e2", N1: "#ede9fe",
  };

  return (
    <div
      className="card card-hover animate-fade-in-up"
      id={`grammar-book-${book.level.toLowerCase()}`}
      style={{
        height: 180,
        padding: 24,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Decorative bg */}
      <div
        style={{
          position: "absolute",
          right: -16,
          bottom: -16,
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: bgColors[book.level] || "#f3f4f6",
        }}
      />

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: book.color,
            }}
          >
            {book.level}
          </span>
          <ChevronRight size={18} color="var(--color-text-muted)" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          {book.lessons} bài học
        </div>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 12 }}>
          Ngữ pháp hệ thống, bài bản
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${book.progress}%`, background: book.color }} />
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 6 }}>
          {book.progress === 0 ? "Chưa bắt đầu" : `${book.progress}% hoàn thành`}
        </div>
      </div>
    </div>
  );
}
