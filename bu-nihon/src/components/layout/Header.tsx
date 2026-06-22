"use client";

import { Share2, Maximize2, Trophy, LogIn, LogOut } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function Header() {
  const { isLoggedIn, setLoggedIn } = useAppStore();

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Bú Kanji", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <header
      className="sticky-header"
      style={{
        position: "fixed",
        top: 0,
        left: 72,
        right: 0,
        height: 64,
        background: "var(--color-header-bg)",
        borderBottom: "1px solid var(--color-border)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: 24,
        zIndex: 40,
        transition: "left 0.2s ease",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <img
          src="/bu-nihon-logo.png"
          alt="Bu nihon"
          style={{
            height: 40,
            width: "auto",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          id="header-share-btn"
          onClick={handleShare}
          style={iconBtnStyle}
          title="Chia sẻ"
        >
          <Share2 size={18} />
        </button>
        <button
          id="header-fullscreen-btn"
          onClick={handleFullscreen}
          style={iconBtnStyle}
          title="Toàn màn hình"
        >
          <Maximize2 size={18} />
        </button>
        <button
          id="header-achievement-btn"
          style={{ ...iconBtnStyle, position: "relative" }}
          title="Thành tích"
        >
          <Trophy size={18} />
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              background: "#f59e0b",
              borderRadius: "50%",
              border: "2px solid var(--color-header-bg)",
            }}
          />
        </button>

        {isLoggedIn ? (
          <button
            id="header-logout-btn"
            onClick={() => setLoggedIn(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 8,
              border: "1.5px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-text-secondary)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.18s ease",
              whiteSpace: "nowrap",
            }}
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        ) : (
          <button
            id="header-login-btn"
            onClick={() => setLoggedIn(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 14px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              border: "none",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s ease",
              boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            <LogIn size={14} />
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 9,
  border: "1.5px solid var(--color-border)",
  background: "transparent",
  color: "var(--color-text-secondary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.18s ease",
};
