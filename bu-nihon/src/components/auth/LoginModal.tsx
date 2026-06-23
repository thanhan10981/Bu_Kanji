"use client";

import { useState, useEffect, useRef } from "react";
import { X, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";

/* ── Google Icon SVG ── */
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

/* ── Monkey Emoji Hanger ── */
function MonkeyHanger({ peekMode }: { peekMode: boolean }) {
  return (
    <div className="monkey-hanger">
      {/* Rope from top */}
      <div className="monkey-rope" />
      {/* The monkey itself: 🐒 normal, 🙈 covering eyes */}
      <div className={`monkey-emoji ${peekMode ? "peek" : ""}`}>
        <span className="monkey-face">
          {peekMode ? "🙈" : "🐒"}
        </span>
        {peekMode && (
          <span className="monkey-blush-bubble">😳</span>
        )}
      </div>
    </div>
  );
}

type AuthTab = "login" | "signup";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const [tab, setTab] = useState<AuthTab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = useAppStore((s) => s.isLoggedIn);

  useEffect(() => {
    if (isLoggedIn && open) onClose();
  }, [isLoggedIn, open, onClose]);

  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(null);
      setShowPw(false);
      setTimeout(() => emailRef.current?.focus(), 80);
    }
  }, [open, tab]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
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
        setLoading(false);
        return;
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
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError("Không thể kết nối Google. Thử lại sau.");
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* ── Keyframes ── */
        @keyframes login-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes login-card-in {
          from { opacity: 0; transform: scale(0.93) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes monkey-drop-in {
          0%   { opacity: 0; transform: translateY(-60px) rotate(-15deg); }
          55%  { opacity: 1; transform: translateY(12px) rotate(6deg); }
          75%  { transform: translateY(-4px) rotate(-3deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes monkey-swing {
          0%,100% { transform: rotate(-8deg); }
          50%      { transform: rotate(8deg); }
        }
        @keyframes monkey-swing-fast {
          0%,100% { transform: rotate(-5deg); }
          50%      { transform: rotate(5deg); }
        }
        @keyframes blush-pop {
          0%   { opacity: 0; transform: scale(0.4) translateY(4px); }
          60%  { opacity: 1; transform: scale(1.2) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes rope-sway {
          0%,100% { transform-origin: top center; transform: rotate(-3deg); }
          50%      { transform-origin: top center; transform: rotate(3deg); }
        }

        /* ── Overlay & Card ── */
        .login-overlay {
          animation: login-overlay-in 0.2s ease both;
        }
        .login-card-wrap {
          animation: login-card-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
          position: relative;
        }

        /* ── Monkey layout ── */
        .monkey-hanger {
          position: absolute;
          top: -8px;
          right: -76px;
          display: flex;
          flex-direction: column;
          align-items: center;
          /* swing pivot at the very top */
          transform-origin: top center;
          animation:
            monkey-drop-in 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.1s both,
            monkey-swing 2.8s ease-in-out 0.7s infinite;
          pointer-events: none;
          z-index: 20;
          filter: drop-shadow(0 6px 16px rgba(0,0,0,0.28));
        }
        .monkey-hanger.peeking {
          animation:
            monkey-swing-fast 1.2s ease-in-out infinite;
        }

        /* Rope */
        .monkey-rope {
          width: 4px;
          height: 36px;
          background: linear-gradient(180deg, #a97c50 0%, #7c5c3b 100%);
          border-radius: 2px;
          animation: rope-sway 2.8s ease-in-out 0.7s infinite;
          transform-origin: top center;
        }
        .monkey-hanger.peeking .monkey-rope {
          animation: rope-sway 1.2s ease-in-out infinite;
        }

        /* Emoji */
        .monkey-emoji {
          position: relative;
          font-size: 64px;
          line-height: 1;
          user-select: none;
          transition: font-size 0.2s ease;
        }
        .monkey-emoji.peek {
          font-size: 60px;
        }
        .monkey-face {
          display: block;
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }

        /* Blush bubble */
        .monkey-blush-bubble {
          position: absolute;
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 20px;
          animation: blush-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
        }

        /* ── Tabs ── */
        .login-tab-active {
          background: var(--color-brand-500);
          color: #fff;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--color-brand-500) 40%, transparent);
        }

        /* ── Input ── */
        .login-input {
          width: 100%;
          padding: 11px 44px 11px 42px;
          border: 1.5px solid var(--color-border);
          border-radius: 10px;
          background: var(--color-card-bg);
          color: var(--color-text-primary);
          font-size: 14px;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
          box-sizing: border-box;
        }
        .login-input:focus {
          border-color: var(--color-brand-500);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-500) 15%, transparent);
        }
        .login-input::placeholder { color: var(--color-text-muted); }

        /* ── Buttons ── */
        .login-btn-primary {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, var(--color-brand-500), #8b5cf6);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .login-btn-primary:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99,102,241,0.35);
        }
        .login-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-btn-google {
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          border: 1.5px solid var(--color-border);
          background: var(--color-card-bg);
          color: var(--color-text-primary);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .login-btn-google:hover:not(:disabled) {
          border-color: #4285F4;
          background: #f8f9ff;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(66,133,244,0.15);
        }
        [data-theme="dark"] .login-btn-google:hover:not(:disabled) { background: #1e263a; }
        .login-btn-google:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Divider ── */
        .login-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--color-text-muted);
          font-size: 12px;
        }
        .login-divider::before,
        .login-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }

        /* ── Alerts ── */
        .login-error {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px; border-radius: 8px;
          background: #fef2f2; border: 1px solid #fecaca;
          color: #dc2626; font-size: 13px;
        }
        [data-theme="dark"] .login-error {
          background: #2a1515; border-color: #7f1d1d; color: #f87171;
        }
        .login-success {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px; border-radius: 8px;
          background: #f0fdf4; border: 1px solid #bbf7d0;
          color: #16a34a; font-size: 13px;
        }
        [data-theme="dark"] .login-success {
          background: #0f2a1a; border-color: #14532d; color: #4ade80;
        }

        /* ── Input icons & toggle ── */
        .input-icon {
          position: absolute;
          left: 13px; top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }
        .pw-toggle {
          position: absolute;
          right: 10px; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          padding: 4px 5px;
          display: flex; align-items: center;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
          font-size: 15px;
          line-height: 1;
        }
        .pw-toggle:hover {
          background: color-mix(in srgb, var(--color-brand-500) 12%, transparent);
          color: var(--color-brand-500);
        }

        /* ── Responsive: hide monkey on very small screens ── */
        @media (max-width: 520px) {
          .monkey-hanger { right: -60px; }
          .monkey-emoji { font-size: 48px; }
          .monkey-rope  { height: 28px; }
        }
      `}</style>

      {/* ── OVERLAY ── */}
      <div
        className="login-overlay"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          zIndex: 2000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}
      >
        {/* ── CARD WRAPPER (relative so monkey can hang off it) ── */}
        <div
          className="login-card-wrap"
          onClick={(e) => e.stopPropagation()}
          style={{ width: "100%", maxWidth: 420 }}
        >
          {/* 🐒 MONKEY HANGER */}
          <MonkeyHanger peekMode={showPw} />

          {/* ── CARD ── */}
          <div style={{
            background: "var(--color-card-bg)",
            borderRadius: 20,
            border: "1px solid var(--color-border)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
            overflow: "hidden",
          }}>
            {/* Rainbow bar */}
            <div style={{
              height: 5,
              background: "linear-gradient(90deg, var(--color-brand-500), #8b5cf6, #ec4899)",
            }} />

            <div style={{ padding: "28px 28px 24px" }}>
              {/* Close */}
              <button
                id="login-modal-close"
                onClick={onClose}
                style={{
                  position: "absolute", top: 16, right: 16,
                  width: 32, height: 32, borderRadius: 8,
                  border: "1.5px solid var(--color-border)",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--color-text-muted)",
                }}
              >
                <X size={16} />
              </button>

              {/* Logo */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: "linear-gradient(135deg, var(--color-brand-500), #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 14px",
                  boxShadow: "0 8px 24px color-mix(in srgb, var(--color-brand-500) 35%, transparent)",
                }}>
                  <span style={{ fontSize: 24, fontFamily: "var(--font-jp)" }}>漢</span>
                </div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.4px" }}>
                  Bú Kanji
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                  {tab === "login" ? "Đăng nhập để theo dõi tiến trình học" : "Tạo tài khoản miễn phí"}
                </p>
              </div>

              {/* Tabs */}
              <div style={{
                display: "flex", gap: 4, padding: 4,
                background: "var(--color-border-light)",
                borderRadius: 10, marginBottom: 20,
              }}>
                {(["login", "signup"] as AuthTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                    className={tab === t ? "login-tab-active" : ""}
                    style={{
                      flex: 1, padding: "8px 0", borderRadius: 8,
                      border: "none", background: "transparent",
                      color: tab === t ? "#fff" : "var(--color-text-secondary)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      transition: "all 0.18s ease",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    {t === "login" ? <><LogIn size={14} /> Đăng nhập</> : <><UserPlus size={14} /> Đăng ký</>}
                  </button>
                ))}
              </div>

              {/* Google */}
              <button id="login-google-btn" className="login-btn-google" onClick={handleGoogle} disabled={googleLoading || loading}>
                {googleLoading
                  ? <span style={{ width: 18, height: 18, border: "2px solid #4285F4", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  : <GoogleIcon />
                }
                Tiếp tục với Google
              </button>

              <div className="login-divider" style={{ margin: "16px 0" }}>hoặc</div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Email */}
                <div style={{ position: "relative" }}>
                  <span className="input-icon"><Mail size={16} /></span>
                  <input
                    ref={emailRef}
                    id="login-email-input"
                    type="email"
                    className="login-input"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div style={{ position: "relative" }}>
                  <span className="input-icon"><Lock size={16} /></span>
                  <input
                    id="login-password-input"
                    type={showPw ? "text" : "password"}
                    className="login-input"
                    placeholder={tab === "signup" ? "Mật khẩu (ít nhất 6 ký tự)" : "Mật khẩu"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={tab === "login" ? "current-password" : "new-password"}
                  />
                  {/* Eye toggle — also triggers monkey */}
                  <button
                    type="button"
                    id="login-pw-toggle"
                    className="pw-toggle"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                    title={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPw ? "🙈" : "👁️"}
                  </button>
                </div>

                {/* Alerts */}
                {error && (
                  <div className="login-error">
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="login-success">
                    <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                    {success}
                  </div>
                )}

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  className="login-btn-primary"
                  disabled={loading || googleLoading}
                  style={{ marginTop: 4 }}
                >
                  {loading
                    ? <span style={{ width: 18, height: 18, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                    : tab === "login"
                      ? <><LogIn size={16} /> Đăng nhập</>
                      : <><UserPlus size={16} /> Tạo tài khoản</>
                  }
                </button>
              </form>

              {/* Footer */}
              <p style={{ marginTop: 16, fontSize: 11, color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.5 }}>
                Bằng cách tiếp tục, bạn đồng ý với{" "}
                <span style={{ color: "var(--color-brand-500)", cursor: "pointer" }}>Điều khoản dịch vụ</span>
                {" "}và{" "}
                <span style={{ color: "var(--color-brand-500)", cursor: "pointer" }}>Chính sách bảo mật</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
