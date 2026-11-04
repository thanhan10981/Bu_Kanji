"use client";
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import { useAppStore } from '@/lib/store';
import type { Card } from './schemas';
import { recordStudyAttempt, type StudyOutcome, type StudyProgress } from './progress';

const useProgressHealth = create<{ error: string }>(() => ({ error: '' }));
const storageMessage = 'Không thể lưu báo cáo trên trình duyệt này. Kết quả hiện tại vẫn hiển thị, nhưng có thể mất khi tải lại trang.';
const storedProgress = z.object({ entries: z.record(z.string(), z.object({
  content: z.string(), wrongCount: z.number().int().nonnegative(), correctCount: z.number().int().nonnegative(),
  lastOutcome: z.enum(['wrong', 'correct', 'corrected']), updatedAt: z.number().finite().nonnegative(),
})) });
interface ProgressStore {
  entries: StudyProgress;
  record: (scope: string, card: Card, outcome: StudyOutcome) => void;
}
const useProgressStore = create<ProgressStore>()(persist((set) => ({
  entries: {},
  record: (scope, card, outcome) => set(state => ({ entries: recordStudyAttempt(state.entries, scope, card, outcome) })),
}), {
  name: 'bu-kanji-written-progress-v1',
  partialize: state => ({ entries: state.entries }),
  storage: createJSONStorage(() => ({
    getItem: key => {
      if (typeof window === 'undefined') return null;
      try { return window.localStorage.getItem(key); }
      catch { useProgressHealth.setState({ error: storageMessage }); return null; }
    },
    setItem: (key, value) => {
      try { window.localStorage.setItem(key, value); useProgressHealth.setState({ error: '' }); }
      catch { useProgressHealth.setState({ error: storageMessage }); }
    },
    removeItem: key => {
      try { window.localStorage.removeItem(key); }
      catch { useProgressHealth.setState({ error: storageMessage }); }
    },
  })),
  merge: (persisted, current) => {
    const parsed = storedProgress.safeParse(persisted);
    if (!parsed.success) {
      if (persisted !== undefined) useProgressHealth.setState({ error: 'Dữ liệu báo cáo đã lưu không đọc được. Lượt học mới sẽ được ghi lại từ đầu.' });
      return current;
    }
    return { ...current, entries: parsed.data.entries };
  },
  onRehydrateStorage: () => (_state, error) => { if (error) useProgressHealth.setState({ error: storageMessage }); },
}));
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
export function useStudyProgress() {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const userId = useAppStore(state => state.user?.id);
  const scope = userId ? `user:${userId}` : 'guest';
  const entries = useProgressStore(state => state.entries);
  const record = useProgressStore(state => state.record);
  const error = useProgressHealth(state => state.error);
  return { hydrated, scope, entries, error, record: (card: Card, outcome: StudyOutcome) => record(scope, card, outcome) };
}
