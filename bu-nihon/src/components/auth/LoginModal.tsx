"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, LogIn, Mail, UserPlus, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { authenticate } from '@/lib/auth/service';
import { ZodError } from 'zod';
import { MonkeyMascot } from "./MonkeyMascot";

type AuthMode = "login" | "signup" | "forgot";

/* ─── Google colour SVG ─── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M43.6 24.5c0-1.5-.1-3-.4-4.5H24v8.5h11c-.5 2.5-1.9 4.6-4 6v5h6.5c3.8-3.5 6.1-8.7 6.1-15z" fill="#4285F4"/>
      <path d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.5-5c-1.8 1.2-4.1 1.9-7 1.9-5.4 0-10-3.6-11.6-8.5H5.6v5.2C9 39.1 16 44 24 44z" fill="#34A853"/>
      <path d="M12.4 27.5c-.4-1.2-.7-2.5-.7-3.8s.3-2.6.7-3.8v-5.2H5.6A19.9 19.9 0 0 0 4 24c0 3.2.8 6.2 2.2 8.8l6.2-5.3z" fill="#FBBC05"/>
      <path d="M24 10.2c3.1 0 5.8 1.1 8 3.1l6-6C34.1 4.1 29.4 2 24 2 16 2 9 6.9 5.6 13.8l6.8 5.2c1.7-4.9 6.3-8.8 11.6-8.8z" fill="#EA4335"/>
    </svg>
  );
}

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <AuthDialog onClose={onClose} /> : null;
}

function AuthDialog({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useMutation({ mutationFn: (action: () => Promise<void>) => action(), retry: false });
  const loading = mutation.isPending;
  const busy = useRef(false);
  const dialog = useRef<HTMLDivElement>(null);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, Math.ceil((waitUntil - now) / 1000));
  const close = () => { if (!busy.current) onClose(); };
  useEffect(() => {
    if (!waitUntil) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [waitUntil]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = dialog.current;
    root?.querySelector<HTMLInputElement>('input')?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy.current) onClose();
      if (event.key !== 'Tab' || !root) return;
      const controls = Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]'));
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keys);
    return () => { document.removeEventListener('keydown', keys); previous?.focus(); };
  }, [onClose]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const setUser = useAppStore((state) => state.setUser);
  const authConfig = useQuery({
    queryKey: ['auth-capabilities'],
    queryFn: () => api.get<{ emailRegistration: boolean; passwordReset: boolean; googleLogin: boolean }>('/auth/config'),
    retry: false, staleTime: 60_000,
  });
  const unavailable = authConfig.isPending || authConfig.isError;

  const run = async (action: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setError(null); setMessage(null);
    try { await mutation.mutateAsync(action); } catch (cause) {
      if (cause instanceof ApiError && cause.status === 429 && cause.retryAfterSeconds) {
        const current = Date.now(); setNow(current); setWaitUntil(current + cause.retryAfterSeconds * 1000);
      }
      setError(cause instanceof ZodError ? cause.issues[0].message : cause instanceof ApiError ? cause.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
      dialog.current?.querySelector<HTMLInputElement>('input')?.focus();
    } finally { busy.current = false; }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'login' && remaining > 0) return;
    void run(async () => {
      if (unavailable) throw new ApiError('Đăng nhập tạm thời chưa sẵn sàng.', 503);
      if (mode === 'login' || mode === 'signup') {
        const user = await authenticate(mode, { email, password });
        setUser(user); setPassword(''); setShowPassword(false); onClose(); return;
      }
      const result = await api.post<{ message: string }>('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setMessage(result.message);
    });
  };

  const title =
    mode === "login" ? "Bú Kanji" :
    mode === "signup" ? "Tạo tài khoản" : "Quên mật khẩu";

  const subtitle =
    mode === "login" ? "Đăng nhập để theo dõi tiến trình học ✨" :
    mode === "signup" ? "Đăng ký bằng email và mật khẩu, không cần xác thực email." :
    "Nhập email để nhận liên kết đặt lại mật khẩu.";

  const submitLabel =
    mode === "login" ? "Đăng nhập" :
    mode === "signup" ? "Tạo tài khoản" : "Gửi liên kết đặt lại";

  const showMonkey = mode === "login" || mode === "signup";

  return (
    <div className="lm-overlay" onMouseDown={close}>
      {/* ── SCENE WRAPPER — keeps monkey + card aligned ── */}
      <div className="lm-scene" onMouseDown={(e) => e.stopPropagation()}>

        {/* ════════════════════════════════════════
            LAYER 2 — Monkey BODY (behind card)
            Rendered BEFORE card so card sits on top
        ════════════════════════════════════════ */}
        {showMonkey && (
          <div className="lm-monkey-body-layer">
            <div className="lm-monkey-body-art" />
          </div>
        )}

        {/* ════════════════════════════════════════
            LAYER 3 — THE CARD
        ════════════════════════════════════════ */}
        <motion.div
          className="lm-card"
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
        >
          {/* close */}
          <button className="lm-close" onClick={close} disabled={loading} aria-label="Đóng">
            <X size={16} />
          </button>

          {/* logo */}
          <div className="lm-logo-wrap">
            <div className="lm-logo">漢</div>
          </div>

          <h2 className="lm-title">{title}</h2>
          <p className="lm-subtitle">{subtitle}</p>

          {/* tabs */}
          {(mode === "login" || mode === "signup") && (
            <div className="lm-tabs">
              <button
                className={`lm-tab${mode === "login" ? " active" : ""}`}
                disabled={loading} onClick={() => { setMode("login"); setError(null); setMessage(null); }}
              >
                <LogIn size={14} /> Đăng nhập
              </button>
              <button
                className={`lm-tab${mode === "signup" ? " active" : ""}`}
                disabled={loading || unavailable || !authConfig.data?.emailRegistration}
                onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
              >
                <UserPlus size={14} /> Đăng ký
              </button>
            </div>
          )}

          {/* google */}
          {(mode === "login" || mode === "signup") && authConfig.data?.googleLogin && (
            <button className="lm-google" type="button" disabled={loading} onClick={api.googleLogin}>
              <GoogleIcon /> Tiếp tục với Google
            </button>
          )}

          {/* divider */}
          {(mode === "login" || mode === "signup") && authConfig.data?.googleLogin && (
            <div className="lm-divider"><span>hoặc</span></div>
          )}

          {/* form */}
          {authConfig.isError && <p className="lm-alert error" role="alert">Không thể kết nối dịch vụ đăng nhập. <button type="button" onClick={() => authConfig.refetch()}>Thử lại</button></p>}
          {authConfig.isPending && <p role="status">Đang kiểm tra dịch vụ đăng nhập…</p>}
          {authConfig.data && !authConfig.data.emailRegistration && <p className="lm-alert" role="status">Đăng ký tài khoản mới tạm thời chưa sẵn sàng.</p>}
          <form noValidate={mode !== 'forgot'} onSubmit={submit} className="lm-form" aria-busy={loading}>
              <label className="lm-field">
                <Mail size={16} className="lm-field-icon" />
                <input
                  type="email"
                  aria-label="Email"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn"
                  autoComplete="email"
                  required
                  className="lm-input"
                />
              </label>
            {(mode === "login" || mode === "signup") && (
              <label className="lm-field">
                <Lock size={16} className="lm-field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  aria-label="Mật khẩu"
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "Mật khẩu (ít nhất 8 ký tự)" : "Mật khẩu"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={mode === "signup" ? 8 : 1}
                  maxLength={128}
                  required
                  className="lm-input lm-input-pw"
                />
                <button
                  type="button"
                  className="lm-pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Hiện hoặc ẩn mật khẩu"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </label>
            )}

            {/* alerts */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="error"
                  className="lm-alert error"
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <AlertCircle size={15} /> {error}
                </motion.p>
              )}
              {message && (
                <motion.p
                  key="msg"
                  className="lm-alert success"
                  role="status"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <CheckCircle2 size={15} /> {message}
                </motion.p>
              )}
            </AnimatePresence>

            {mode === 'login' && remaining > 0 && <p role="status">Vui lòng chờ {remaining} giây trước khi đăng nhập lại.</p>}
            <button className="lm-submit" disabled={loading || unavailable || (mode === 'login' && remaining > 0)}>
              {loading ? (
                <span className="lm-spinner" />
              ) : (
                <><LogIn size={16} /> {submitLabel}</>
              )}
            </button>
          </form>

          {/* secondary actions */}
          <div className="lm-secondary-actions">
            {mode === "login" && (
              <button className="lm-link" disabled={loading || unavailable || !authConfig.data?.passwordReset} onClick={() => setMode("forgot")}>Quên mật khẩu?</button>
            )}
            {mode === "forgot" && (
              <button className="lm-link" disabled={loading} onClick={() => { setMode("login"); setError(null); setMessage(null); }}>Quay lại đăng nhập</button>
            )}
            {(mode === "login" || mode === "signup") && (
              <p className="lm-legal">
                Bằng cách tiếp tục, bạn đồng ý với{" "}
                <a href="#">Điều khoản dịch vụ</a> và <a href="#">Chính sách bảo mật</a>
              </p>
            )}
          </div>
        </motion.div>

        {/* ════════════════════════════════════════
            LAYER 4 — Monkey HEAD + HANDS (above card)
            Positioned absolutely to overlap the top of card
        ════════════════════════════════════════ */}
        {showMonkey && (
          <div className="lm-monkey-top-layer">
            <MonkeyMascot showPassword={showPassword} />
          </div>
        )}
      </div>

      <style>{`
        /* ── Overlay ── */
        .lm-overlay {
          overflow-y: auto;
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(6, 8, 24, 0.72);
          backdrop-filter: blur(12px) saturate(1.4);
        }

        /* ── Scene: positions monkey + card as one unit ── */
        /* padding-top = SVG hand y-position (148) minus desired overlap into card (10) ≈ 138px */
        .lm-scene {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          /* Hands sit at SVG y=148. We want them at the card top edge. */
          padding-top: 138px;
        }

        /* ── Layer 2: body behind card ── */
        /* top = padding-top(138) - hand_y(148) = -10px → body starts just behind card top */
        .lm-monkey-body-layer {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 160px;
          height: 130px;
          z-index: 1;
          pointer-events: none;
        }
        /* Body art — a simple rounded torso silhouette */
        .lm-monkey-body-art {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 90px;
          height: 80px;
          border-radius: 50% 50% 42% 42% / 60% 60% 40% 40%;
          background: radial-gradient(ellipse at 38% 30%, #C87840 0%, #8B5520 55%, #4A2808 100%);
          box-shadow: inset 0 -8px 16px rgba(0,0,0,0.28), 0 4px 12px rgba(0,0,0,0.22);
        }

        /* ── Layer 3: card ── */
        .lm-card {
          position: relative;
          z-index: 3;
          width: min(100%, 440px);
          padding: 32px 32px 28px;
          border-radius: 28px;
          background: #ffffff;
          color: #0f172a;
          box-shadow:
            0 2px 0 0 rgba(255,255,255,0.9) inset,
            0 32px 80px rgba(0,0,0,0.28),
            0 8px 24px rgba(59,130,246,0.12);
          border: 1px solid rgba(255,255,255,0.7);
        }

        [data-theme="dark"] .lm-card {
          background: #1c2333;
          color: #e2e8f0;
          border-color: rgba(255,255,255,0.08);
          box-shadow:
            0 32px 80px rgba(0,0,0,0.55),
            0 8px 24px rgba(59,130,246,0.08);
        }

        /* ── Layer 4: monkey head + hands on top of card ── */
        /* top = padding-top(138) - hand_y(148) = -10px                       */
        /* This makes the SVG gripping hands (y=148) land exactly at y=138 in */
        /* the scene, which is the card's top edge.                            */
        .lm-monkey-top-layer {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          pointer-events: none;
          width: 280px;
          display: flex;
          justify-content: center;
        }

        /* ── Close btn ── */
        .lm-close {
          position: absolute;
          right: 16px;
          top: 16px;
          width: 32px;
          height: 32px;
          border: 0;
          border-radius: 10px;
          background: rgba(0,0,0,0.05);
          color: #64748b;
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: background 0.18s, color 0.18s;
        }
        .lm-close:hover { background: rgba(0,0,0,0.1); color: #0f172a; }
        [data-theme="dark"] .lm-close:hover { background: rgba(255,255,255,0.1); color: #e2e8f0; }

        /* ── Logo ── */
        .lm-logo-wrap { display: flex; justify-content: center; margin-bottom: 14px; }
        .lm-logo {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: #fff;
          font-size: 27px;
          box-shadow: 0 8px 24px rgba(59,130,246,0.4), 0 2px 4px rgba(0,0,0,0.12);
        }

        /* ── Title / subtitle ── */
        .lm-title {
          text-align: center;
          margin: 0 0 6px;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.3px;
          color: #0f172a;
        }
        [data-theme="dark"] .lm-title { color: #e2e8f0; }

        .lm-subtitle {
          text-align: center;
          color: #64748b;
          font-size: 13.5px;
          margin: 0 0 20px;
          line-height: 1.5;
        }

        /* ── Auth Tabs ── */
        .lm-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: #f1f5f9;
          border-radius: 14px;
          margin-bottom: 16px;
        }
        [data-theme="dark"] .lm-tabs { background: #21262d; }

        .lm-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 0;
          border-radius: 10px;
          padding: 10px;
          background: transparent;
          color: #64748b;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .lm-tab.active {
          background: #3b82f6;
          color: #fff;
          box-shadow: 0 4px 12px rgba(59,130,246,0.35);
        }
        .lm-tab:not(.active):hover { background: rgba(0,0,0,0.04); color: #0f172a; }
        [data-theme="dark"] .lm-tab:not(.active):hover { background: rgba(255,255,255,0.06); color: #e2e8f0; }

        /* ── Google btn ── */
        .lm-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 12px;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          color: #0f172a;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.18s ease;
          margin-bottom: 4px;
        }
        .lm-google:hover {
          border-color: #3b82f6;
          background: #f8faff;
          box-shadow: 0 2px 8px rgba(59,130,246,0.12);
        }
        .lm-google:disabled { opacity: .6; cursor: not-allowed; }
        [data-theme="dark"] .lm-google {
          background: #21262d;
          border-color: #30363d;
          color: #e2e8f0;
        }
        [data-theme="dark"] .lm-google:hover { border-color: #3b82f6; background: #1c2333; }

        /* ── Divider ── */
        .lm-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 14px 0 2px;
          color: #94a3b8;
          font-size: 12px;
        }
        .lm-divider::before,
        .lm-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        [data-theme="dark"] .lm-divider::before,
        [data-theme="dark"] .lm-divider::after { background: #30363d; }

        /* ── Form ── */
        .lm-form { display: grid; gap: 10px; margin-top: 12px; }

        .lm-field {
          position: relative;
          display: flex;
          align-items: center;
        }
        .lm-field-icon {
          position: absolute;
          left: 14px;
          color: #94a3b8;
          pointer-events: none;
          z-index: 1;
        }
        .lm-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          border: 1.5px solid #e5e7eb;
          border-radius: 14px;
          background: #fafafa;
          color: #0f172a;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .lm-input:focus {
          border-color: #3b82f6;
          background: #fff;
          box-shadow: 0 0 0 3.5px rgba(59,130,246,0.14);
        }
        .lm-input::placeholder { color: #94a3b8; }
        .lm-input-pw { padding-right: 44px; }
        [data-theme="dark"] .lm-input {
          border-color: #30363d;
          background: #161b22;
          color: #e2e8f0;
        }
        [data-theme="dark"] .lm-input:focus { border-color: #3b82f6; background: #1c2333; }

        .lm-pw-toggle {
          position: absolute;
          right: 12px;
          border: 0;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: grid;
          place-items: center;
          transition: color 0.18s;
        }
        .lm-pw-toggle:hover { color: #3b82f6; }

        /* ── Alerts ── */
        .lm-alert {
          margin: 0;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          display: flex;
          gap: 8px;
          align-items: flex-start;
          line-height: 1.45;
        }
        .lm-alert.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .lm-alert.success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
        [data-theme="dark"] .lm-alert.error { background: rgba(220,38,38,0.12); border-color: rgba(220,38,38,0.25); }
        [data-theme="dark"] .lm-alert.success { background: rgba(21,128,61,0.12); border-color: rgba(21,128,61,0.25); }

        /* ── Submit btn ── */
        .lm-submit {
          width: 100%;
          padding: 14px;
          border: 0;
          border-radius: 14px;
          background: linear-gradient(135deg, #3b82f6 0%, #6d28d9 100%);
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.22s ease;
          box-shadow: 0 6px 20px rgba(59,130,246,0.38);
          margin-top: 4px;
          letter-spacing: 0.2px;
        }
        .lm-submit:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 10px 28px rgba(59,130,246,0.48);
          filter: brightness(1.06);
        }
        .lm-submit:active:not(:disabled) { transform: translateY(0); }
        .lm-submit:disabled { opacity: .65; cursor: not-allowed; }

        /* spinner */
        .lm-spinner {
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: lm-spin 0.7s linear infinite;
        }
        @keyframes lm-spin { to { transform: rotate(360deg); } }

        /* ── Secondary actions ── */
        .lm-secondary-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-top: 14px;
        }
        .lm-link {
          border: 0;
          background: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: color 0.18s;
          padding: 2px 4px;
        }
        .lm-link:hover { color: #2563eb; text-decoration: underline; }
        .lm-link:disabled { opacity: .6; cursor: not-allowed; }

        .lm-legal {
          font-size: 11.5px;
          color: #94a3b8;
          text-align: center;
          margin: 0;
          line-height: 1.6;
        }
        .lm-legal a { color: #3b82f6; text-decoration: none; font-weight: 500; }
        .lm-legal a:hover { text-decoration: underline; }

        /* ── Responsive ── */
        /* Mobile: scale monkey to 0.82 → hands at 148×0.82≈121px, layer top=-10 → lands at 111px */
        @media (max-width: 480px) {
          .lm-scene { padding-top: 111px; }
          .lm-card { padding: 24px 20px 20px; border-radius: 24px; }
          .lm-monkey-top-layer { width: 230px; }
          .lm-monkey-top-layer > div {
            transform: scale(0.82);
            transform-origin: top center;
          }
          .lm-monkey-body-layer { transform: translateX(-50%) scale(0.82); transform-origin: top center; }
        }
      `}</style>
    </div>
  );
}
