"use client";

import { useState } from "react";
import { CheckCircle2, Lock, ChevronDown, Map } from "lucide-react";

const levels = [
  {
    level: "N5",
    kanji: 118,
    vocab: 800,
    grammar: 80,
    kaiwa: 15,
    sessions: 58,
    color: "#10b981",
    description: "Điểm khởi đầu hoàn hảo cho người mới bắt đầu",
    unlocked: true,
    completed: false,
  },
  {
    level: "N4",
    kanji: 300,
    vocab: 1500,
    grammar: 170,
    kaiwa: 25,
    sessions: 96,
    color: "#3b82f6",
    description: "Giao tiếp cơ bản trong cuộc sống hàng ngày",
    unlocked: true,
    completed: false,
  },
  {
    level: "N3",
    kanji: 650,
    vocab: 3000,
    grammar: 280,
    kaiwa: 40,
    sessions: 160,
    color: "#f59e0b",
    description: "Đọc hiểu báo chí và giao tiếp tự nhiên",
    unlocked: false,
    completed: false,
  },
  {
    level: "N2",
    kanji: 1000,
    vocab: 6000,
    grammar: 380,
    kaiwa: 60,
    sessions: 240,
    color: "#ef4444",
    description: "Làm việc và học tập chuyên nghiệp bằng tiếng Nhật",
    unlocked: false,
    completed: false,
  },
  {
    level: "N1",
    kanji: 2136,
    vocab: 10000,
    grammar: 480,
    kaiwa: 80,
    sessions: 360,
    color: "#8b5cf6",
    description: "Thông thạo hoàn toàn như người bản xứ",
    unlocked: false,
    completed: false,
  },
];

export default function RoadmapPage() {
  const [activeLevel, setActiveLevel] = useState("N5");

  const totalSessions = levels.reduce((sum, l) => sum + l.sessions, 0);
  const completedSessions = 0;
  const progressPct = Math.round((completedSessions / totalSessions) * 100);

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      {/* Hero card */}
      <div
        className="card animate-fade-in-up"
        style={{
          padding: "32px 36px",
          marginBottom: 32,
          background: "linear-gradient(135deg, #1e3a8a, #312e81)",
          border: "none",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(#ffffff06 1px, transparent 1px), linear-gradient(90deg, #ffffff06 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Map size={28} color="#fff" />
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>Hành trình của bạn</h1>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, margin: 0 }}>
                Lộ trình JLPT từ N5 đến N1
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 600 }}>
              Tiến độ tổng: {completedSessions}/{totalSessions} buổi
            </span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{progressPct}%</span>
          </div>
          <div style={{ height: 10, borderRadius: 9999, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                borderRadius: 9999,
                background: "linear-gradient(90deg, #10b981, #3b82f6)",
                width: `${Math.max(progressPct, 2)}%`,
                transition: "width 0.6s ease",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
            {[
              { label: "Tổng buổi", value: totalSessions },
              { label: "Đã hoàn thành", value: completedSessions },
              { label: "Còn lại", value: totalSessions - completedSessions },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div style={{ position: "relative" }}>
        {/* Timeline line */}
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 32,
            bottom: 32,
            width: 2,
            background: "linear-gradient(180deg, #10b981, #3b82f6, #f59e0b, #ef4444, #8b5cf6)",
            borderRadius: 9999,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {levels.map((lvl, i) => {
            const isActive = activeLevel === lvl.level;
            return (
              <div
                key={lvl.level}
                className="animate-fade-in-up"
                style={{ paddingLeft: 64, position: "relative", animationDelay: `${i * 80}ms` }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    position: "absolute",
                    left: 16,
                    top: 20,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: lvl.unlocked ? lvl.color : "#94a3b8",
                    border: "3px solid var(--color-page-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: lvl.unlocked ? `0 0 0 4px ${lvl.color}30` : "none",
                    zIndex: 1,
                  }}
                >
                  {!lvl.unlocked && <Lock size={10} color="#fff" />}
                  {lvl.completed && <CheckCircle2 size={10} color="#fff" />}
                </div>

                {/* Card */}
                <div
                  className="card"
                  id={`roadmap-level-${lvl.level.toLowerCase()}`}
                  onClick={() => setActiveLevel(lvl.level)}
                  style={{
                    padding: "20px 24px",
                    cursor: "pointer",
                    border: isActive ? `2px solid ${lvl.color}` : "1.5px solid var(--color-border)",
                    boxShadow: isActive ? `0 4px 20px ${lvl.color}25` : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isActive ? 16 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: lvl.unlocked ? lvl.color : "#94a3b8" }}>
                        {lvl.level}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{lvl.description}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                          {lvl.sessions} buổi học
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      size={18}
                      color="var(--color-text-muted)"
                      style={{ transform: isActive ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }}
                    />
                  </div>

                  {isActive && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                      {[
                        { label: "Kanji", value: lvl.kanji, unit: "chữ" },
                        { label: "Từ vựng", value: lvl.vocab.toLocaleString(), unit: "từ" },
                        { label: "Ngữ pháp", value: lvl.grammar, unit: "mẫu" },
                        { label: "Hội thoại", value: lvl.kaiwa, unit: "bài" },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 10,
                            background: lvl.color + "10",
                            border: `1px solid ${lvl.color}25`,
                          }}
                        >
                          <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {stat.label}
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: lvl.color }}>
                            {stat.value}
                            <span style={{ fontSize: 12, fontWeight: 400, color: "var(--color-text-secondary)", marginLeft: 3 }}>{stat.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
