export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
let refreshRequest: Promise<Response> | null = null;

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (response.status === 401 && !retried && path !== '/auth/refresh' && path !== '/auth/login') {
    refreshRequest ??= fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json' } }).finally(() => { refreshRequest = null; });
    const refreshed = await refreshRequest;
    if (refreshed.ok) return request<T>(path, init, true);
  }
  const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/login' && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-expired'));
    }
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new ApiError(message ?? 'Đã xảy ra lỗi. Vui lòng thử lại.', response.status);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) => request<T>(path, { method: 'DELETE', body: body === undefined ? undefined : JSON.stringify(body) }),
  googleLogin: () => window.location.assign(`${API_URL}/auth/google?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`),
};
