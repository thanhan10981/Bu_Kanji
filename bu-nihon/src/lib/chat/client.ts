import { useMutation } from '@tanstack/react-query';
import { contextMessages, type Message, type Model } from './schema';
import { chatErrorMessage } from './errors';

let refresh: Promise<Response> | null = null;
export async function chatFetch<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const timeout = AbortSignal.timeout(140000);
  const response = await fetch(path, { ...init, credentials: 'same-origin', signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout });
  if (response.status === 401 && !retried) {
    refresh ??= fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin', signal: AbortSignal.timeout(25000) }).finally(() => { refresh = null; });
    const renewed = await refresh.catch(() => null);
    if (renewed?.ok) return chatFetch<T>(path, init, true);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth-expired'));
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(chatErrorMessage(data, response.status));
  if (!data) throw new Error('Server trả dữ liệu không hợp lệ.');
  return data as T;
}
export function useChatRequest() {
  return useMutation({
    mutationFn: ({ messages, model }: { messages: Message[]; model: Model }) => chatFetch<{ text: string }>('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: contextMessages(messages) }),
    }), retry: false,
  });
}
