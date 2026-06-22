"use client";

import { X, Volume2, VolumeX, Sun, Moon, Check } from "lucide-react";
import { useAppStore, type Language, type AccentColor, type FontKanji } from "@/lib/store";

const languages: { value: Language; label: string; flag: string }[] = [
  { value: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "th", label: "ไทย", flag: "🇹🇭" },
  { value: "id", label: "Indonesia", flag: "🇮🇩" },
];

const accentColors: { value: AccentColor; color: string; label: string }[] = [
  { value: "blue", color: "#3b82f6", label: "Blue" },
  { value: "green", color: "#22c55e", label: "Green" },
  { value: "purple", color: "#8b5cf6", label: "Purple" },
  { value: "orange", color: "#f97316", label: "Orange" },
  { value: "red", color: "#ef4444", label: "Red" },
  { value: "pink", color: "#ec4899", label: "Pink" },
];

const fontKanjis: { value: FontKanji; preview: string }[] = [
  { value: "Zen Maru Gothic", preview: "あ" },
  { value: "Noto Sans JP", preview: "あ" },
  { value: "UD Digi Kyokasho", preview: "あ" },
  { value: "Comfortaa", preview: "あ" },
  { value: "Itim", preview: "あ" },
  { value: "OS Default", preview: "あ" },
];

export function SettingsModal() {
  const {
    settingsOpen, setSettingsOpen,
    language, setLanguage,
    theme, setTheme,
    soundEnabled, toggleSound,
    accentColor, setAccentColor,
    fontKanji, setFontKanji,
  } = useAppStore();

  if (!settingsOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setSettingsOpen(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "var(--color-card-bg)",
          borderRadius: 20,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>⚙ Cài đặt</h2>
          <button
            id="settings-close-btn"
            onClick={() => setSettingsOpen(false)}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-text-secondary)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Language */}
        <section>
          <h3 style={sectionTitle}>Ngôn ngữ</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {languages.map((lang) => (
              <label
                key={lang.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${language === lang.value ? "var(--color-brand-500)" : "var(--color-border)"}`,
                  background: language === lang.value ? "color-mix(in srgb, var(--color-brand-500) 8%, transparent)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                <input
                  type="radio"
                  name="language"
                  value={lang.value}
                  checked={language === lang.value}
                  onChange={() => setLanguage(lang.value)}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: 20 }}>{lang.flag}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{lang.label}</span>
                {language === lang.value && (
                  <Check size={16} color="var(--color-brand-500)" style={{ marginLeft: "auto" }} />
                )}
              </label>
            ))}
          </div>
        </section>

        {/* Theme */}
        <section>
          <h3 style={sectionTitle}>Giao diện</h3>
          <div
            style={{
              display: "flex",
              background: "var(--color-border-light)",
              borderRadius: 10,
              padding: 4,
              gap: 4,
            }}
          >
            {(["light", "dark"] as const).map((t) => (
              <button
                key={t}
                id={`theme-${t}-btn`}
                onClick={() => setTheme(t)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "9px 0",
                  borderRadius: 7,
                  border: "none",
                  background: theme === t ? "var(--color-card-bg)" : "transparent",
                  color: theme === t ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  fontWeight: theme === t ? 600 : 400,
                  cursor: "pointer",
                  fontSize: 13,
                  transition: "all 0.18s ease",
                  boxShadow: theme === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {t === "light" ? <Sun size={15} /> : <Moon size={15} />}
                {t === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </section>

        {/* Sound */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ ...sectionTitle, margin: 0 }}>Âm thanh</h3>
            <button
              id="sound-toggle-btn"
              onClick={toggleSound}
              style={{
                width: 48,
                height: 26,
                borderRadius: 9999,
                background: soundEnabled ? "var(--color-brand-500)" : "var(--color-border)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s ease",
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  position: "absolute",
                  top: 3,
                  left: soundEnabled ? 25 : 3,
                  transition: "left 0.2s ease",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {soundEnabled ? (
                  <Volume2 size={10} color="var(--color-brand-500)" />
                ) : (
                  <VolumeX size={10} color="var(--color-text-muted)" />
                )}
              </div>
            </button>
          </div>
        </section>

        {/* Accent Color */}
        <section>
          <h3 style={sectionTitle}>Màu chủ đạo</h3>
          <div style={{ display: "flex", gap: 10 }}>
            {accentColors.map((c) => (
              <button
                key={c.value}
                id={`accent-${c.value}-btn`}
                onClick={() => setAccentColor(c.value)}
                title={c.label}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: c.color,
                  border: accentColor === c.value ? `3px solid ${c.color}` : "3px solid transparent",
                  outline: accentColor === c.value ? `2px solid var(--color-card-bg)` : "none",
                  outlineOffset: -4,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  transform: accentColor === c.value ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </section>

        {/* Font Kanji */}
        <section>
          <h3 style={sectionTitle}>Font Kanji</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {fontKanjis.map((f) => (
              <button
                key={f.value}
                id={`font-${f.value.toLowerCase().replace(/\s/g, "-")}-btn`}
                onClick={() => setFontKanji(f.value)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "12px 8px",
                  borderRadius: 10,
                  border: `1.5px solid ${fontKanji === f.value ? "var(--color-brand-500)" : "var(--color-border)"}`,
                  background: fontKanji === f.value ? "color-mix(in srgb, var(--color-brand-500) 8%, transparent)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    fontFamily: f.value === "OS Default" ? "sans-serif" : f.value,
                    lineHeight: 1,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {f.preview}
                </span>
                <span style={{ fontSize: 10, fontWeight: 500, color: "var(--color-text-secondary)", textAlign: "center" }}>
                  {f.value}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  margin: "0 0 10px 0",
};
