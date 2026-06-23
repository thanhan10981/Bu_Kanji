"use client";

import { useState, useEffect, useRef } from "react";
import {
  X, Mail, Lock, LogIn, UserPlus,
  AlertCircle, CheckCircle2, Eye, EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { MonkeyMascot } from "./MonkeyMascot";

/* ─────────────────────────────────────────
   Google icon
───────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   Spinner helper
───────────────────────────────────────── */
function Spinner({ color = "#fff" }: { color?: string }) {
  return (
    <span
      style={{
        width: 18, height: 18,
        border: `2.5px solid ${color}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        display: "inline-block",
        animation: "lm-spin 0.75s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

/* ─────────────────────────────────────────
   Types
───────────────────────────────────────── */
type AuthTab = "login" | "signup";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

/* ─────────────────────────────────────────
   LoginModal
───────────────────────────────────────── */
export function LoginModal({ open, onClose }: LoginModalProps) {
  const [tab, setTab]             = useState<AuthTab>("login");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = useAppStore((s) => s.isLoggedIn);

  /* auto-close when logged in */
  useEffect(() => { if (isLoggedIn && open) onClose(); }, [isLoggedIn, open, onClose]);

  /* reset & focus on open/tab change */
  useEffect(() => {
    if (open) {
      setError(null); setSuccess(null); setShowPw(false);
      setTimeout(() => emailRef.current?.focus(), 80);
    }
  }, [open, tab]);

  /* Escape to close */
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const supabase = createClient();

  /* ── Auth handlers ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    try {
      if (tab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setSuccess("Kiểm tra email của bạn để xác nhận tài khoản! 📬");
        setLoading(false); return;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      if (msg.includes("Invalid login credentials")) setError("Email hoặc mật khẩu không đúng.");
      else if (msg.includes("User already registered")) setError("Email này đã được đăng ký. Hãy đăng nhập.");
      else if (msg.includes("Password should be")) setError("Mật khẩu phải có ít nhất 6 ký tự.");
      else setError(msg);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true); setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError("Không thể kết nối Google. Thử lại sau."); setGoogleLoading(false); }
  };

  /* ────────────────────────────────────────
     Render
  ──────────────────────────────────────── */
  return (
    <>
      {/* ── Global styles for this modal ── */}
      <style>{`
        @keyframes lm-spin      { to { transform: rotate(360deg); } }
        @keyframes lm-overlay   { from { opacity:0; } to { opacity:1; } }
        @keyframes lm-card-in {
          from { opacity:0; transform: scale(0.92) translateY(24px); }
          to   { opacity:1; transform: scale(1)    translateY(0);     }
        }
        @keyframes lm-slide-alert {
          from { opacity:0; transform: translateY(-6px); }
          to   { opacity:1; transform: translateY(0);    }
        }

        .lm-overlay {
          position: fixed; inset: 0; z-index: 2000;
          display: flex; align-items: center; justify-content: center;
          /* extra top padding so monkey above card isn't clipped */
          padding: 20px;
          padding-top: 150px;
          background: rgba(6,6,20,0.62);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          animation: lm-overlay 0.22s ease both;
        }

        /* Card wrapper — needs overflow visible for the monkey */
        .lm-wrap {
          position: relative;
          width: 100%;
          max-width: 420px;
          animation: lm-card-in 0.3s cubic-bezier(0.34,1.56,0.64,1) 0.06s both;
        }

        /* The card itself */
        .lm-card {
          background: var(--color-card-bg);
          border-radius: 28px;
          overflow: hidden;
          box-shadow:
            0 0 0 1px var(--color-border),
            0 4px 8px rgba(0,0,0,0.06),
            0 16px 40px rgba(0,0,0,0.18),
            0 40px 80px rgba(0,0,0,0.12);
        }

        /* Top rainbow bar */
        .lm-topbar {
          height: 5px;
          background: linear-gradient(90deg,
            #6366f1 0%, #8b5cf6 30%, #ec4899 65%, #f59e0b 100%
          );
        }

        /* ── Tabs ── */
        .lm-tab-rail {
          display: flex; gap: 3px; padding: 4px;
          background: var(--color-border-light);
          border-radius: 12px;
        }
        .lm-tab {
          flex: 1; display: flex; align-items: center; justify-content: center;
          gap: 6px; padding: 9px 0;
          border: none; border-radius: 9px;
          background: transparent;
          color: var(--color-text-secondary);
          font-size: 13px; font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
        }
        .lm-tab:hover:not(.active) {
          background: rgba(99,102,241,0.06);
          color: var(--color-text-primary);
        }
        .lm-tab.active {
          background: var(--color-brand-500);
          color: #fff;
          box-shadow: 0 2px 12px color-mix(in srgb, var(--color-brand-500) 45%, transparent);
          transform: scale(1.02);
        }

        /* ── Inputs ── */
        .lm-input-wrap { position: relative; }
        .lm-input-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none; display: flex;
          transition: color 0.18s;
        }
        .lm-input {
          width: 100%;
          padding: 12px 44px 12px 42px;
          border: 1.5px solid var(--color-border);
          border-radius: 12px;
          background: var(--color-card-bg);
          color: var(--color-text-primary);
          font-size: 14px; line-height: 1.4;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .lm-input::placeholder { color: var(--color-text-muted); }
        .lm-input:focus {
          border-color: var(--color-brand-500);
          box-shadow: 0 0 0 3.5px color-mix(in srgb, var(--color-brand-500) 14%, transparent);
        }
        .lm-input:focus + .lm-input-icon-overlay,
        .lm-input-wrap:focus-within .lm-input-icon {
          color: var(--color-brand-500);
        }

        /* Eye toggle */
        .lm-pw-toggle {
          position: absolute; right: 11px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer; display: flex; align-items: center;
          color: var(--color-text-muted);
          padding: 4px 5px; border-radius: 7px;
          transition: background 0.15s, color 0.15s, transform 0.2s;
        }
        .lm-pw-toggle:hover {
          background: color-mix(in srgb, var(--color-brand-500) 10%, transparent);
          color: var(--color-brand-500);
          transform: translateY(-50%) scale(1.12);
        }

        /* ── Buttons ── */
        .lm-btn-google {
          width: 100%; display: flex; align-items: center; justify-content: center;
          gap: 10px; padding: 12px;
          border: 1.5px solid var(--color-border);
          border-radius: 12px;
          background: var(--color-card-bg);
          color: var(--color-text-primary);
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.18s, box-shadow 0.2s;
        }
        .lm-btn-google:hover:not(:disabled) {
          border-color: #4285F4;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(66,133,244,0.18);
        }
        [data-theme="dark"] .lm-btn-google:hover:not(:disabled) {
          background: rgba(66,133,244,0.08);
        }
        .lm-btn-google:disabled { opacity: 0.55; cursor: not-allowed; }

        .lm-btn-primary {
          width: 100%; display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 13px;
          border: none; border-radius: 12px;
          background: linear-gradient(135deg, var(--color-brand-500) 0%, #8b5cf6 60%, #a855f7 100%);
          color: #fff;
          font-size: 14px; font-weight: 700;
          cursor: pointer;
          transition: opacity 0.18s, transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 4px 16px color-mix(in srgb, var(--color-brand-500) 35%, transparent);
        }
        .lm-btn-primary:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 8px 28px color-mix(in srgb, var(--color-brand-500) 40%, transparent);
        }
        .lm-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Close button */
        .lm-close {
          position: absolute; top: 14px; right: 14px;
          width: 32px; height: 32px;
          border: 1.5px solid var(--color-border);
          border-radius: 9px;
          background: transparent; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--color-text-muted);
          transition: background 0.15s, color 0.15s, transform 0.3s, border-color 0.15s;
        }
        .lm-close:hover {
          background: #fef2f2;
          border-color: #fecaca;
          color: #ef4444;
          transform: rotate(90deg);
        }
        [data-theme="dark"] .lm-close:hover {
          background: rgba(239,68,68,0.12);
        }

        /* Divider */
        .lm-divider {
          display: flex; align-items: center; gap: 12px;
          color: var(--color-text-muted); font-size: 12px;
        }
        .lm-divider::before, .lm-divider::after {
          content: ""; flex: 1; height: 1px; background: var(--color-border);
        }

        /* Alerts */
        .lm-alert {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 11px 13px; border-radius: 10px;
          font-size: 13px; line-height: 1.45;
          animation: lm-slide-alert 0.22s ease both;
        }
        .lm-alert-error {
          background: #fef2f2; border: 1.5px solid #fecaca; color: #dc2626;
        }
        [data-theme="dark"] .lm-alert-error {
          background: rgba(220,38,38,0.1); border-color: rgba(220,38,38,0.35); color: #f87171;
        }
        .lm-alert-success {
          background: #f0fdf4; border: 1.5px solid #bbf7d0; color: #16a34a;
        }
        [data-theme="dark"] .lm-alert-success {
          background: rgba(22,163,74,0.1); border-color: rgba(22,163,74,0.35); color: #4ade80;
        }

        /* Logo icon */
        .lm-logo-icon {
          width: 56px; height: 56px; border-radius: 16px;
          background: linear-gradient(135deg, var(--color-brand-500), #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
          box-shadow:
            0 8px 24px color-mix(in srgb, var(--color-brand-500) 40%, transparent),
            0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .lm-logo-icon:hover { transform: scale(1.07) rotate(-4deg); }

        /* Responsive */
        @media (max-width: 520px) {
          .lm-wrap { max-width: 100%; }
          .lm-card { border-radius: 22px; }
          .lm-overlay { padding: 12px; padding-top: 130px; align-items: flex-start; }
        }
      `}</style>

      {/* ── OVERLAY ── */}
      <div className="lm-overlay" onClick={onClose}>

        {/* ── CARD WRAPPER ── */}
        <div className="lm-wrap" onClick={(e) => e.stopPropagation()}>

          {/* 🐒 Monkey mascot — centered, peeking over the top edge of the card */}
          <div
            style={{
              position: "absolute",
              /* y=130 of SVG (hands) aligns with card top (y=0 of wrap) */
              top: -130,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              pointerEvents: "none",
              filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.28))",
              userSelect: "none",
            }}
          >
            <MonkeyMascot coverEyes={showPw} />
          </div>

          {/* ── CARD ── */}
          <div className="lm-card">
            {/* Top gradient bar */}
            <div className="lm-topbar" />

            {/* Card body */}
            <div style={{ padding: "28px 28px 26px", position: "relative" }}>

              {/* Close button */}
              <button id="login-modal-close" className="lm-close" onClick={onClose} aria-label="Đóng">
                <X size={15} />
              </button>

              {/* ── Logo + Title ── */}
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <div className="lm-logo-icon">
                  <span style={{ fontSize: 26, fontFamily: "var(--font-jp)", color: "#fff", lineHeight: 1 }}>漢</span>
                </div>
                <h2 style={{
                  margin: 0, fontSize: 22, fontWeight: 800,
                  color: "var(--color-text-primary)", letterSpacing: "-0.5px",
                }}>
                  Bú Kanji
                </h2>
                <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                  {tab === "login"
                    ? "Đăng nhập để theo dõi tiến trình học ✨"
                    : "Tạo tài khoản miễn phí và bắt đầu học 🎌"}
                </p>
              </div>

              {/* ── Tab switcher ── */}
              <div className="lm-tab-rail" style={{ marginBottom: 18 }}>
                {(["login", "signup"] as AuthTab[]).map((t) => (
                  <button
                    key={t}
                    className={`lm-tab${tab === t ? " active" : ""}`}
                    onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                  >
                    {t === "login"
                      ? <><LogIn size={13} /> Đăng nhập</>
                      : <><UserPlus size={13} /> Đăng ký</>}
                  </button>
                ))}
              </div>

              {/* ── Google button ── */}
              <button
                id="login-google-btn"
                className="lm-btn-google"
                onClick={handleGoogle}
                disabled={googleLoading || loading}
              >
                {googleLoading ? <Spinner color="#4285F4" /> : <GoogleIcon />}
                Tiếp tục với Google
              </button>

              {/* ── OR divider ── */}
              <div className="lm-divider" style={{ margin: "14px 0" }}>hoặc</div>

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 11 }}>

                {/* Email */}
                <div className="lm-input-wrap">
                  <span className="lm-input-icon">
                    <Mail size={16} />
                  </span>
                  <input
                    ref={emailRef}
                    id="login-email-input"
                    type="email"
                    className="lm-input"
                    placeholder="Email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="lm-input-wrap">
                  <span className="lm-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    id="login-password-input"
                    type={showPw ? "text" : "password"}
                    className="lm-input"
                    placeholder={tab === "signup" ? "Mật khẩu (ít nhất 6 ký tự)" : "Mật khẩu"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={tab === "login" ? "current-password" : "new-password"}
                  />
                  {/* Eye/monkey toggle — triggers mascot */}
                  <button
                    type="button"
                    id="login-pw-toggle"
                    className="lm-pw-toggle"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                    title={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Alerts */}
                {error && (
                  <div className="lm-alert lm-alert-error" role="alert">
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="lm-alert lm-alert-success" role="status">
                    <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{success}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  className="lm-btn-primary"
                  disabled={loading || googleLoading}
                  style={{ marginTop: 4 }}
                >
                  {loading ? (
                    <Spinner />
                  ) : tab === "login" ? (
                    <><LogIn size={16} /> Đăng nhập</>
                  ) : (
                    <><UserPlus size={16} /> Tạo tài khoản</>
                  )}
                </button>
              </form>

              {/* Footer */}
              <p style={{
                marginTop: 18, fontSize: 11,
                color: "var(--color-text-muted)",
                textAlign: "center", lineHeight: 1.6,
              }}>
                Bằng cách tiếp tục, bạn đồng ý với{" "}
                <span style={{ color: "var(--color-brand-500)", cursor: "pointer" }}>
                  Điều khoản dịch vụ
                </span>{" "}
                và{" "}
                <span style={{ color: "var(--color-brand-500)", cursor: "pointer" }}>
                  Chính sách bảo mật
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
