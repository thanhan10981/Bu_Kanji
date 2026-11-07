import { useMutation } from '@tanstack/react-query';
import type { CardInput } from '@/lib/vocabulary/schemas';
import { contextMessages, type Message, type Model } from './schema';

export async function chatFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, signal: AbortSignal.timeout(110000) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? 'Không thể kết nối server. Vui lòng thử lại.');
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
export function useFileImport() {
  return useMutation({
    mutationFn: ({ file, model }: { file: File; model: Model }) => {
      const body = new FormData(); body.set('file', file); body.set('model', model);
      return chatFetch<{ cards: CardInput[]; source: string }>('/api/vocabulary/import', { method: 'POST', body });
    }, retry: false,
  });
}
