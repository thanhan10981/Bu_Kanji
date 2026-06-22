"use client";

import { useState } from "react";
import { Plus, CreditCard, Target, Zap, FileText } from "lucide-react";

const learningModes = [
  {
    id: "flashcard",
    title: "Flashcard",
    description: "Lật thẻ xem đáp án. Ôn tập theo thuật toán SRS thông minh.",
    icon: CreditCard,
    color: "#3b82f6",
    bg: "linear-gradient(135deg, #dbeafe, #eff6ff)",
  },
  {
    id: "quiz",
    title: "Trắc nghiệm",
    description: "Chọn đáp án đúng. Kiểm tra khả năng ghi nhớ của bạn.",
    icon: Target,
    color: "#10b981",
    bg: "linear-gradient(135deg, #d1fae5, #ecfdf5)",
  },
  {
    id: "drill",
    title: "Nhồi nhét",
    description: "Học nhanh với tốc độ cao. Tăng cường trí nhớ ngắn hạn.",
    icon: Zap,
    color: "#f59e0b",
    bg: "linear-gradient(135deg, #fef3c7, #fffbeb)",
  },
];

export default function SelfStudyPage() {
  const [lessons, setLessons] = useState<{ id: number; title: string; count: number }[]>([]);

  const createLesson = () => {
    const id = Date.now();
    setLessons((prev) => [
      ...prev,
      { id, title: `Bài học ${prev.length + 1}`, count: Math.floor(Math.random() * 20) + 5 },
    ]);
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1000 }}>
      {/* Header */}
      <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
          🧠 Chủ động học
        </h1>
        <p style={{ color: "var(--color-text-secondary)", margin: "4px 0 0", fontSize: 14 }}>
          Tạo bài học cá nhân và luyện tập theo phong cách của bạn
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
        {/* Lesson list */}
        <div className="card animate-fade-in-up" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
              <FileText size={16} style={{ display: "inline", marginRight: 8 }} />
              Danh sách bài
            </h2>
            <button className="btn-primary" onClick={createLesson} id="create-lesson-btn">
              <Plus size={15} />
              Tạo bài mới
            </button>
          </div>

          {lessons.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px 20px",
                color: "var(--color-text-muted)",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "var(--color-border-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={32} color="var(--color-text-muted)" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                  Chưa có bài nào
                </div>
                <div style={{ fontSize: 13 }}>Tạo bài học đầu tiên của bạn ngay!</div>
              </div>
              <button className="btn-primary" onClick={createLesson}>
                <Plus size={15} />
                Tạo bài mới
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="card-hover"
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: "var(--color-brand-500)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {lesson.count}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{lesson.title}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{lesson.count} từ vựng</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["FC", "TN", "NN"].map((mode) => (
                      <button
                        key={mode}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: "var(--color-border-light)",
                          border: "1px solid var(--color-border)",
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Learning modes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Chế độ học</h2>
          {learningModes.map((mode, i) => (
            <div
              key={mode.id}
              id={`learning-mode-${mode.id}`}
              className="card card-hover animate-fade-in-up"
              style={{
                padding: 20,
                cursor: "pointer",
                background: mode.bg,
                border: `1px solid ${mode.color}30`,
                animationDelay: `${i * 80}ms`,
              }}
            >
              <div style={{ display: "flex", gap: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: mode.color + "20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <mode.icon size={22} color={mode.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--color-text-primary)", marginBottom: 4 }}>
                    {mode.title}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                    {mode.description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
