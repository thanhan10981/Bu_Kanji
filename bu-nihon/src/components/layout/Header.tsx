"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Maximize2, Trophy, LogIn, LogOut, Settings, User } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { LoginModal } from "@/components/auth/LoginModal";

function Avatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl: string | null; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid var(--color-brand-500)",
        }}
      />
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: "linear-gradient(135deg, var(--color-brand-500), #8b5cf6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.36,
      fontWeight: 700,
      color: "#fff",
      border: "2px solid var(--color-brand-500)",
      flexShrink: 0,
    }}>
      {initials || "?"}
    </div>
  );
}

export function Header() {
  const { isLoggedIn, userProfile, loginModalOpen, setLoginModalOpen } = useAppStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setDropdownOpen(false);
  };

  return (
    <>
      <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />

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
            style={{ height: 40, width: "auto", objectFit: "contain" }}
          />
        </div>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button id="header-share-btn" onClick={handleShare} style={iconBtnStyle} title="Chia sẻ">
            <Share2 size={18} />
          </button>
          <button id="header-fullscreen-btn" onClick={handleFullscreen} style={iconBtnStyle} title="Toàn màn hình">
            <Maximize2 size={18} />
          </button>
          <button id="header-achievement-btn" style={{ ...iconBtnStyle, position: "relative" }} title="Thành tích">
            <Trophy size={18} />
            <span style={{
              position: "absolute", top: 4, right: 4,
              width: 8, height: 8,
              background: "#f59e0b",
              borderRadius: "50%",
              border: "2px solid var(--color-header-bg)",
            }} />
          </button>

          {isLoggedIn && userProfile ? (
            /* ── User Avatar + Dropdown ── */
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                id="header-avatar-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 10px 4px 4px",
                  borderRadius: 9999,
                  border: "1.5px solid var(--color-border)",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                <Avatar name={userProfile.name} avatarUrl={userProfile.avatar_url} size={32} />
                <span style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  maxWidth: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {userProfile.name}
                </span>
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: 200,
                  background: "var(--color-card-bg)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: 12,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                  zIndex: 100,
                  animation: "fadeInUp 0.18s ease both",
                }}>
                  {/* User info */}
                  <div style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}>
                    <Avatar name={userProfile.name} avatarUrl={userProfile.avatar_url} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {userProfile.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {userProfile.email}
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  {[
                    { id: "dropdown-profile", icon: <User size={14} />, label: "Hồ sơ" },
                    { id: "dropdown-settings", icon: <Settings size={14} />, label: "Cài đặt" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      id={item.id}
                      style={dropdownItemStyle}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-border-light)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ color: "var(--color-text-muted)" }}>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}

                  <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />

                  <button
                    id="header-logout-btn"
                    onClick={handleLogout}
                    style={{ ...dropdownItemStyle, color: "#ef4444" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <LogOut size={14} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Login Button ── */
            <button
              id="header-login-btn"
              onClick={() => setLoginModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 16px",
                borderRadius: 9999,
                background: "linear-gradient(135deg, var(--color-brand-500), #8b5cf6)",
                border: "none",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: "0 2px 10px color-mix(in srgb, var(--color-brand-500) 40%, transparent)",
                whiteSpace: "nowrap",
              }}
            >
              <LogIn size={15} />
              Đăng nhập
            </button>
          )}
        </div>
      </header>
    </>
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

const dropdownItemStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 14px",
  display: "flex",
  alignItems: "center",
  gap: 9,
  background: "transparent",
  border: "none",
  color: "var(--color-text-primary)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.15s ease",
  textAlign: "left",
};
