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

/* ── Monkey SVG Character ── */
function MonkeySVG({ eyesCovered }: { eyesCovered: boolean }) {
  return (
    <svg
      viewBox="0 0 120 140"
      width="110"
      height="130"
      style={{ display: "block", filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.35))" }}
    >
      {/* === TAIL / HANG ROPE === */}
      <path
        d="M60 10 Q80 2 90 -10"
        stroke="#7c5c3b"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* === EARS === */}
      <ellipse cx="24" cy="62" rx="13" ry="11" fill="#8B6340" />
      <ellipse cx="24" cy="62" rx="8" ry="7" fill="#e8a87c" />
      <ellipse cx="96" cy="62" rx="13" ry="11" fill="#8B6340" />
      <ellipse cx="96" cy="62" rx="8" ry="7" fill="#e8a87c" />

      {/* === HEAD === */}
      <ellipse cx="60" cy="60" rx="38" ry="36" fill="#8B6340" />

      {/* === FACE PLATE === */}
      <ellipse cx="60" cy="70" rx="26" ry="22" fill="#e8a87c" />

      {/* === EYES (normal) === */}
      {!eyesCovered && (
        <>
          {/* Left eye white */}
          <ellipse cx="46" cy="58" rx="9" ry="9" fill="white" />
          {/* Right eye white */}
          <ellipse cx="74" cy="58" rx="9" ry="9" fill="white" />
          {/* Left pupil */}
          <ellipse cx="47" cy="59" rx="5" ry="5.5" fill="#1a0a00" />
          {/* Right pupil */}
          <ellipse cx="75" cy="59" rx="5" ry="5.5" fill="#1a0a00" />
          {/* Left shine */}
          <circle cx="49" cy="57" r="1.8" fill="white" />
          {/* Right shine */}
          <circle cx="77" cy="57" r="1.8" fill="white" />
        </>
      )}

      {/* === HANDS COVERING EYES === */}
      {eyesCovered && (
        <>
          {/* Left hand covering left eye */}
          <ellipse cx="46" cy="57" rx="14" ry="12" fill="#8B6340" />
          <ellipse cx="46" cy="57" rx="11" ry="9" fill="#c47a45" />
          {/* Fingers left */}
          <ellipse cx="35" cy="50" rx="5" ry="7" fill="#8B6340" transform="rotate(-15 35 50)" />
          <ellipse cx="40" cy="47" rx="5" ry="7.5" fill="#8B6340" transform="rotate(-5 40 47)" />
          <ellipse cx="46" cy="46" rx="5" ry="7.5" fill="#8B6340" />
          <ellipse cx="52" cy="47" rx="5" ry="7.5" fill="#8B6340" transform="rotate(5 52 47)" />
          <ellipse cx="57" cy="50" rx="5" ry="7" fill="#8B6340" transform="rotate(15 57 50)" />

          {/* Right hand covering right eye */}
          <ellipse cx="74" cy="57" rx="14" ry="12" fill="#8B6340" />
          <ellipse cx="74" cy="57" rx="11" ry="9" fill="#c47a45" />
          {/* Fingers right */}
          <ellipse cx="63" cy="50" rx="5" ry="7" fill="#8B6340" transform="rotate(-15 63 50)" />
          <ellipse cx="68" cy="47" rx="5" ry="7.5" fill="#8B6340" transform="rotate(-5 68 47)" />
          <ellipse cx="74" cy="46" rx="5" ry="7.5" fill="#8B6340" />
          <ellipse cx="80" cy="47" rx="5" ry="7.5" fill="#8B6340" transform="rotate(5 80 47)" />
          <ellipse cx="85" cy="50" rx="5" ry="7" fill="#8B6340" transform="rotate(15 85 50)" />

          {/* Peek eyes above hands */}
          <ellipse cx="46" cy="49" rx="6" ry="4" fill="white" />
          <ellipse cx="74" cy="49" rx="6" ry="4" fill="white" />
          <ellipse cx="46" cy="50" rx="3" ry="2.5" fill="#1a0a00" />
          <ellipse cx="74" cy="50" rx="3" ry="2.5" fill="#1a0a00" />
        </>
      )}

      {/* === NOSE === */}
      <ellipse cx="60" cy="74" rx="7" ry="5" fill="#c47a45" />
      <circle cx="57" cy="74" r="2" fill="#7a4020" />
      <circle cx="63" cy="74" r="2" fill="#7a4020" />

      {/* === MOUTH === */}
      {!eyesCovered ? (
        /* Happy smile */
        <path d="M50 83 Q60 92 70 83" stroke="#7a4020" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      ) : (
        /* Shy / embarrassed expression */
        <path d="M52 85 Q60 82 68 85" stroke="#7a4020" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      )}

      {/* === BLUSH when eyes covered === */}
      {eyesCovered && (
        <>
          <ellipse cx="36" cy="78" rx="9" ry="6" fill="#e07070" opacity="0.4" />
          <ellipse cx="84" cy="78" rx="9" ry="6" fill="#e07070" opacity="0.4" />
        </>
      )}

      {/* === LEFT ARM hanging === */}
      <path
        d="M26 55 Q10 48 8 30 Q7 20 16 18"
        stroke="#8B6340"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left hand grip */}
      <circle cx="16" cy="18" r="8" fill="#8B6340" />
      <circle cx="16" cy="18" r="5" fill="#c47a45" />

      {/* === RIGHT ARM hanging === */}
      <path
        d="M94 55 Q110 48 112 30 Q113 20 104 18"
        stroke="#8B6340"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right hand grip */}
      <circle cx="104" cy="18" r="8" fill="#8B6340" />
      <circle cx="104" cy="18" r="5" fill="#c47a45" />

      {/* === BODY === */}
      <ellipse cx="60" cy="118" rx="24" ry="22" fill="#8B6340" />
      <ellipse cx="60" cy="120" rx="16" ry="16" fill="#c47a45" />

      {/* === LEGS === */}
      <path d="M48 132 Q42 145 36 148" stroke="#8B6340" strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M72 132 Q78 145 84 148" stroke="#8B6340" strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* Feet */}
      <ellipse cx="34" cy="150" rx="10" ry="6" fill="#8B6340" transform="rotate(-15 34 150)" />
      <ellipse cx="86" cy="150" rx="10" ry="6" fill="#8B6340" transform="rotate(15 86 150)" />
    </svg>
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

  // Close modal when user logs in
  useEffect(() => {
    if (isLoggedIn && open) onClose();
  }, [isLoggedIn, open, onClose]);

  // Auto-focus email
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(null);
      setShowPw(false);
      setTimeout(() => emailRef.current?.focus(), 80);
    }
  }, [open, tab]);

  // Close on Escape
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
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setSuccess("Kiểm tra email của bạn để xác nhận tài khoản! 📬");
        setLoading(false);
        return;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã xảy ra lỗi";
      if (msg.includes("Invalid login credentials")) {
        setError("Email hoặc mật khẩu không đúng.");
      } else if (msg.includes("User already registered")) {
        setError("Email này đã được đăng ký. Hãy đăng nhập.");
      } else if (msg.includes("Password should be")) {
        setError("Mật khẩu phải có ít nhất 6 ký tự.");
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("Không thể kết nối Google. Thử lại sau.");
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes login-modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes login-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes monkey-swing {
          0%   { transform: rotate(-6deg) translateY(0px); }
          25%  { transform: rotate(-2deg) translateY(-5px); }
          50%  { transform: rotate(6deg)  translateY(0px); }
          75%  { transform: rotate(2deg)  translateY(-5px); }
          100% { transform: rotate(-6deg) translateY(0px); }
        }
        @keyframes monkey-bounce-in {
          0%   { opacity: 0; transform: translateY(-40px) rotate(-10deg); }
          60%  { opacity: 1; transform: translateY(8px) rotate(4deg); }
          80%  { transform: translateY(-4px) rotate(-2deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .login-overlay {
          animation: login-overlay-in 0.2s ease both;
        }
        .login-card-wrapper {
          animation: login-modal-in 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
          position: relative;
        }
        .monkey-container {
          position: absolute;
          top: -20px;
          right: -90px;
          width: 110px;
          transform-origin: top center;
          animation: monkey-bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both,
                     monkey-swing 3s ease-in-out 0.5s infinite;
          pointer-events: none;
          z-index: 10;
        }
        .monkey-container.peeking {
          animation: monkey-bounce-in 0s both,
                     monkey-swing 1.5s ease-in-out infinite;
        }
        .login-tab-active {
          background: var(--color-brand-500);
          color: #fff;
          box-shadow: 0 2px 8px color-mix(in srgb, var(--color-brand-500) 40%, transparent);
        }
        .login-input {
          width: 100%;
          padding: 11px 40px 11px 42px;
          border: 1.5px solid var(--color-border);
          border-radius: 10px;
          background: var(--color-card-bg);
          color: var(--color-text-primary);
          font-size: 14px;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .login-input:focus {
          border-color: var(--color-brand-500);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-500) 15%, transparent);
        }
        .login-input::placeholder { color: var(--color-text-muted); }
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
        [data-theme="dark"] .login-btn-google:hover:not(:disabled) {
          background: #1e263a;
        }
        .login-btn-google:disabled { opacity: 0.6; cursor: not-allowed; }
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
        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 13px;
        }
        [data-theme="dark"] .login-error {
          background: #2a1515;
          border-color: #7f1d1d;
          color: #f87171;
        }
        .login-success {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          font-size: 13px;
        }
        [data-theme="dark"] .login-success {
          background: #0f2a1a;
          border-color: #14532d;
          color: #4ade80;
        }
        .input-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-text-muted);
          pointer-events: none;
        }
        .pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          padding: 2px;
          display: flex;
          border-radius: 6px;
          transition: color 0.15s, background 0.15s;
        }
        .pw-toggle:hover {
          color: var(--color-brand-500);
          background: color-mix(in srgb, var(--color-brand-500) 10%, transparent);
        }
        /* Eye icon transition */
        .pw-eye-icon {
          transition: opacity 0.18s, transform 0.18s;
        }
      `}</style>

      {/* Overlay */}
      <div
        className="login-overlay"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        {/* Wrapper for card + monkey */}
        <div
          className="login-card-wrapper"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 420,
            /* extra right padding so monkey fits */
          }}
        >
          {/* 🐒 Monkey character hanging on the right side */}
          <div className={`monkey-container${showPw ? " peeking" : ""}`}>
            <MonkeySVG eyesCovered={showPw} />
          </div>

          {/* Card */}
          <div
            style={{
              width: "100%",
              background: "var(--color-card-bg)",
              borderRadius: 20,
              border: "1px solid var(--color-border)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
              overflow: "hidden",
            }}
          >
            {/* Header gradient bar */}
            <div style={{
              height: 5,
              background: "linear-gradient(90deg, var(--color-brand-500), #8b5cf6, #ec4899)",
            }} />

            <div style={{ padding: "28px 28px 24px" }}>
              {/* Close btn */}
              <button
                id="login-modal-close"
                onClick={onClose}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1.5px solid var(--color-border)",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-muted)",
                }}
              >
                <X size={16} />
              </button>

              {/* Logo + Title */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, var(--color-brand-500), #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  boxShadow: "0 8px 24px color-mix(in srgb, var(--color-brand-500) 35%, transparent)",
                }}>
                  <span style={{ fontSize: 24, fontFamily: "var(--font-jp)" }}>漢</span>
                </div>
                <h2 style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.4px",
                }}>
                  Bú Kanji
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
                  {tab === "login" ? "Đăng nhập để theo dõi tiến trình học" : "Tạo tài khoản miễn phí"}
                </p>
              </div>

              {/* Tab switcher */}
              <div style={{
                display: "flex",
                gap: 4,
                padding: 4,
                background: "var(--color-border-light)",
                borderRadius: 10,
                marginBottom: 20,
              }}>
                {(["login", "signup"] as AuthTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(null); setSuccess(null); }}
                    className={tab === t ? "login-tab-active" : ""}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      color: tab === t ? "#fff" : "var(--color-text-secondary)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    {t === "login" ? <><LogIn size={14} /> Đăng nhập</> : <><UserPlus size={14} /> Đăng ký</>}
                  </button>
                ))}
              </div>

              {/* Google button */}
              <button
                id="login-google-btn"
                className="login-btn-google"
                onClick={handleGoogle}
                disabled={googleLoading || loading}
              >
                {googleLoading
                  ? <span style={{ width: 18, height: 18, border: "2px solid #4285F4", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  : <GoogleIcon />
                }
                Tiếp tục với Google
              </button>

              <div className="login-divider" style={{ margin: "16px 0" }}>hoặc</div>

              {/* Email/Password form */}
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
                  <button
                    type="button"
                    className="pw-toggle"
                    id="login-pw-toggle"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                    title={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    <span className="pw-eye-icon" style={{ display: "flex" }}>
                      {showPw ? (
                        /* eye-off: password visible → monkey covers eyes */
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        /* eye: password hidden → monkey looks normally */
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </span>
                  </button>
                </div>

                {/* Error / Success messages */}
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

              {/* Footer hint */}
              <p style={{
                marginTop: 16,
                fontSize: 11,
                color: "var(--color-text-muted)",
                textAlign: "center",
                lineHeight: 1.5,
              }}>
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
