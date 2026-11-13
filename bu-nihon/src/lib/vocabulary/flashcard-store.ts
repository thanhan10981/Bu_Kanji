"use client";
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useAppStore } from '@/lib/store';
import type { SetDetail } from './schemas';
import { createFlashSession, emptyFlashData, flashDataSchema, flashKey, rateFlashcard, type FlashData, type FlashFilter } from './flashcard';

const message = 'Không thể lưu tiến độ Flashcard. Kết quả chỉ còn trong phiên này và có thể mất khi tải lại trang.';
const useHealth = create<{ error: string }>(() => ({ error: '' }));
interface FlashStore {
  data: FlashData;
  start: (scope: string, set: SetDetail, filter: FlashFilter, reverse: boolean) => void;
  rate: (scope: string, set: SetDetail, sessionId: string, cardId: string, remembered: boolean) => void;
}
const useFlashStore = create<FlashStore>()(persist(set => ({
  data: emptyFlashData(),
  start: (scope, deck, filter, reverse) => set(state => {
    const session = createFlashSession(state.data, scope, deck.cards, filter, reverse);
    return session ? { data: { ...state.data, sessions: { ...state.data.sessions, [flashKey(scope, deck.id)]: session } } } : state;
  }),
  rate: (scope, deck, sessionId, cardId, remembered) => set(state => ({ data: rateFlashcard(state.data, scope, deck.id, deck.cards, sessionId, cardId, remembered) })),
}), {
  name: 'bu-nihon-flashcard-v1',
  partialize: state => ({ data: state.data }),
  storage: createJSONStorage(() => ({
    getItem: key => { try { return window.localStorage.getItem(key); } catch { useHealth.setState({ error: message }); return null; } },
    setItem: (key, value) => { try { window.localStorage.setItem(key, value); } catch { useHealth.setState({ error: message }); } },
    removeItem: key => { try { window.localStorage.removeItem(key); } catch { useHealth.setState({ error: message }); } },
  })),
  merge: (saved, current) => {
    const parsed = flashDataSchema.safeParse((saved as { data?: unknown } | undefined)?.data);
    if (parsed.success) return { ...current, data: parsed.data };
    if (saved !== undefined) useHealth.setState({ error: 'Tiến độ Flashcard đã lưu không đọc được. Bạn có thể bắt đầu lượt học mới.' });
    return current;
  },
  onRehydrateStorage: () => (_state, error) => { if (error) useHealth.setState({ error: message }); },
}));
const subscribe = () => () => {};
export function useFlashProgress() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const userId = useAppStore(state => state.user?.id);
  const authStatus = useAppStore(state => state.authStatus);
  const scope = userId ? `user:${userId}` : 'guest';
  const store = useFlashStore();
  const error = useHealth(state => state.error);
  return { ...store, scope, error, ready: hydrated && authStatus === 'ready', authError: authStatus === 'error' };
}
