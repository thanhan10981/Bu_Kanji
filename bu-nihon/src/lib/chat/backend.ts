import 'server-only';
import { AuthorizationError } from './authorize';

export async function importBackend<T>(request: Request, path: string, body?: unknown): Promise<T> {
  // Only server-defined relative paths can reach this function.
  const target = process.env.API_PROXY_TARGET;
  let base: URL;
  try { base = new URL(target ?? ''); } catch { throw new AuthorizationError(503, 'Chưa cấu hình API_PROXY_TARGET tới Render.'); }
  const local = process.env.NODE_ENV === 'development' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname);
  if ((base.protocol !== 'https:' && !(local && base.protocol === 'http:')) || base.pathname !== '/' || base.search || base.hash || base.username || base.password) throw new AuthorizationError(503, 'API_PROXY_TARGET không hợp lệ.');
  const cookie = request.headers.get('cookie')?.split(';').map(item => item.trim()).find(item => item.startsWith('access_token='));
  if (!cookie) throw new AuthorizationError(401, 'Vui lòng đăng nhập để nhập file.');
  try {
    const response = await fetch(`${base.origin}/api/ai/imports/${path}`, { method: body ? 'PUT' : 'GET', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000), cache: 'no-store', redirect: 'error' });
    if (response.status === 401) throw new AuthorizationError(401, 'Phiên đăng nhập đã hết hạn.');
    if (response.status === 404) throw new AuthorizationError(404, 'Lần nhập đã hết hạn hoặc backend chưa deploy bản hỗ trợ 100 MB.');
    if (!response.ok) throw new AuthorizationError(503, 'Không truy cập được tiến độ nhập file trên Render. Hãy thử lại.');
    return await response.json() as T;
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    throw new AuthorizationError(503, 'Render chưa phản hồi. Tiến độ đã lưu có thể tiếp tục sau.');
  }
}
