"use client";

import { useState } from "react";
import { Search, Volume2, Waves, ChevronRight } from "lucide-react";
import { accentData, type AccentEntry } from "@/data/misc";
import { accentSearchSchema } from "@/lib/schemas";
import { useQuery } from "@tanstack/react-query";

async function searchAccent(query: string): Promise<AccentEntry[]> {
  // Simulate API delay
  await new Promise((r) => setTimeout(r, 300));
  return accentData.filter(
    (a) =>
      a.word.includes(query) ||
      a.kana.includes(query)
  );
}

function PitchDiagram({ entry }: { entry: AccentEntry }) {
  const chars = entry.kana.split("");
  const pitchH = entry.pitch === 0
    ? chars.map((_, i) => i > 0) // heiban: L then all H
    : chars.map((_, i) => i > 0 && i <= entry.pitch); // drop after pitch position

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 0, height: 48, padding: "4px 0" }}>
      {chars.map((char, i) => {
        const isHigh = entry.pitch === 0 ? i > 0 : i >= 1 && i <= entry.pitch;
        const nextHigh = entry.pitch === 0 ? true : i + 1 >= 1 && i + 1 <= entry.pitch;
        const dropping = isHigh && !nextHigh && i < chars.length - 1;

        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: isHigh ? "#ef4444" : "#3b82f6",
                marginBottom: isHigh ? 0 : 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--color-card-bg)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
              }}
            />
            {i < chars.length - 1 && (
              <div
                style={{
                  position: "relative",
                  width: 32,
                  height: 2,
                  background: dropping ? "linear-gradient(to right, #ef4444, #3b82f6)" : isHigh ? "#ef4444" : "#3b82f6",
                  marginTop: -10,
                  transform: dropping ? "rotate(25deg)" : "none",
                  transformOrigin: "left center",
                }}
              />
            )}
            <span style={{ fontSize: 12, marginTop: 6, fontFamily: "var(--font-jp)", color: "var(--color-text-primary)" }}>
              {char}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AccentPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["accent", submitted],
    queryFn: () => searchAccent(submitted),
    enabled: submitted.length > 0,
  });

  const handleSearch = () => {
    const parsed = accentSearchSchema.safeParse({ query });
    if (parsed.success) setSubmitted(query);
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 900 }}>
      {/* Hero */}
      <div
        className="card animate-fade-in-up"
        style={{
          padding: "48px 40px",
          marginBottom: 32,
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0c4a6e 100%)",
          border: "none",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Waveform decorations */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3, padding: "0 40px 0", opacity: 0.2, pointerEvents: "none" }}>
          {Array.from({ length: 40 }).map((_, i) => {
            const h = Math.abs(Math.sin(i * 0.4) * 40) + 8;
            return (
              <div
                key={i}
                style={{
                  width: 3,
                  height: h,
                  background: "#60a5fa",
                  borderRadius: 9999,
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>

        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "2px solid rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginInline: "auto",
              marginBottom: 16,
            }}
          >
            <Waves size={30} color="#60a5fa" />
          </div>
          <h1 style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 900, color: "#fff", margin: "0 0 6px", fontFamily: "var(--font-jp)" }}>
            アクセント辞典
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, margin: "0 0 28px" }}>
            Tra cứu pitch accent tiếng Nhật
          </p>

          {/* Search */}
          <div style={{ maxWidth: 480, marginInline: "auto", position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 18,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.5)",
                zIndex: 1,
              }}
            />
            <input
              id="accent-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Tìm kiếm từ... (VD: 桜, さくら)"
              style={{
                width: "100%",
                padding: "14px 60px 14px 50px",
                borderRadius: 14,
                border: "1.5px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 15,
                backdropFilter: "blur(8px)",
                outline: "none",
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                padding: "8px 16px",
                borderRadius: 9,
                background: "#3b82f6",
                border: "none",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Tra
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {isFetching && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
          Đang tìm...
        </div>
      )}

      {submitted && !isFetching && results.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--color-text-muted)" }}>
          Không tìm thấy kết quả cho &ldquo;{submitted}&rdquo;
        </div>
      )}

      {results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {results.map((entry) => (
            <div key={entry.word} className="card animate-fade-in-up" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontSize: 36, fontWeight: 700, fontFamily: "var(--font-jp)" }}>{entry.word}</span>
                    <span style={{ fontSize: 18, color: "var(--color-text-secondary)", fontFamily: "var(--font-jp)" }}>{entry.kana}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: "#dbeafe",
                        color: "#2563eb",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {entry.type}
                    </span>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: "#f3f4f6",
                        color: "var(--color-text-secondary)",
                        fontSize: 12,
                      }}
                    >
                      Pattern: {entry.pattern}
                    </span>
                  </div>
                </div>
                <button
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#dbeafe",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Volume2 size={20} color="#2563eb" />
                </button>
              </div>

              {/* Pitch diagram */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "var(--color-border-light)",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Biểu đồ Pitch Accent
                </div>
                <PitchDiagram entry={entry} />
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Cao (H)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }} />
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Thấp (L)</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggested searches */}
      {!submitted && (
        <div className="card animate-fade-in-up" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 16px", color: "var(--color-text-secondary)" }}>
            Gợi ý tra cứu
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {accentData.slice(0, 8).map((entry) => (
              <button
                key={entry.word}
                onClick={() => { setQuery(entry.word); setSubmitted(entry.word); }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 9999,
                  border: "1.5px solid var(--color-border)",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 15,
                  fontFamily: "var(--font-jp)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--color-text-primary)",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-brand-500)"; e.currentTarget.style.color = "var(--color-brand-500)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text-primary)"; }}
              >
                {entry.word}
                <ChevronRight size={13} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
