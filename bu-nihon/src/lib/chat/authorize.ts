import 'server-only';

export class AuthorizationError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Vercel asks the existing Render backend to validate its HttpOnly access cookie
// and reserve a database-backed quota before any paid gateway request.
export async function authorizeAI(request: Request) {
  const cookie = request.headers.get('cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith('access_token='));
  if (!cookie || cookie === 'access_token=') throw new AuthorizationError(401, 'Vui lòng đăng nhập để sử dụng AI.');
  const configured = process.env.API_PROXY_TARGET;
  let backend: URL;
  try { backend = new URL(configured ?? ''); }
  catch { throw new AuthorizationError(503, 'Chưa cấu hình API_PROXY_TARGET tới backend Render.'); }
  const local = process.env.NODE_ENV === 'development' && ['localhost', '127.0.0.1', '[::1]'].includes(backend.hostname);
  if ((backend.protocol !== 'https:' && !(local && backend.protocol === 'http:')) || backend.pathname !== '/' || backend.search || backend.hash || backend.username || backend.password) {
    throw new AuthorizationError(503, 'API_PROXY_TARGET phải là origin HTTPS của backend Render.');
  }
  try {
    const response = await fetch(`${backend.origin}/api/ai/authorize`, {
      method: 'POST', headers: { Cookie: cookie }, cache: 'no-store', redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
    if (response.status === 401) throw new AuthorizationError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    if (response.status === 429) {
      // Only accept bounded text from our configured backend, never gateway diagnostics.
      const body = await response.json().catch(() => null) as { message?: unknown } | null;
      throw new AuthorizationError(429, typeof body?.message === 'string' ? body.message.slice(0, 300) : 'Đã đạt hạn mức AI. Vui lòng thử lại sau.');
    }
    if (!response.ok) throw new AuthorizationError(503, 'Chưa xác minh được quyền dùng AI. Kiểm tra backend Render đã deploy bản mới và chạy migration.');
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || !('allowed' in body) || body.allowed !== true) {
      throw new AuthorizationError(503, 'Backend chưa xác nhận quyền dùng AI.');
    }
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    throw new AuthorizationError(503, 'Backend xác thực chưa phản hồi. Render có thể đang khởi động; vui lòng thử lại.');
  }
}
