'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setError('Liên kết đặt lại mật khẩu không hợp lệ.'); return; }
    if (password !== confirmPassword) { setError('Mật khẩu xác nhận chưa khớp.'); return; }
    setError(null); setLoading(true);
    try {
      const result = await api.post<{ message: string }>('/auth/reset-password', { token, password });
      setMessage(result.message);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Không thể đặt lại mật khẩu.');
    } finally { setLoading(false); }
  }

  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
    <form onSubmit={submit} style={{ width: 'min(100%, 420px)', padding: 32, border: '1px solid var(--color-border)', borderRadius: 20, background: 'var(--color-card-bg)' }}>
      <h1 style={{ marginTop: 0 }}>Đặt lại mật khẩu</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>Tạo mật khẩu mới, tối thiểu 8 ký tự.</p>
      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} placeholder="Mật khẩu mới" required style={inputStyle} />
      <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} placeholder="Xác nhận mật khẩu mới" required style={inputStyle} />
      {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}
      {message ? <p style={{ color: '#15803d' }}>{message} <Link href="/kanji">Đăng nhập</Link></p> : <button disabled={loading} style={buttonStyle}>{loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}</button>}
    </form>
  </main>;
}

const inputStyle = { width: '100%', boxSizing: 'border-box' as const, padding: 12, marginTop: 12, borderRadius: 10, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)' };
const buttonStyle = { width: '100%', marginTop: 16, padding: 12, border: 0, borderRadius: 10, background: 'var(--color-brand-500)', color: '#fff', fontWeight: 700, cursor: 'pointer' };
