'use client';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { z } from 'zod';
import { useAppStore } from '@/lib/store';
import { reportSchema, type ExamReport } from '@/lib/exams/schema';
import { selectedQuestions, type PublicExam } from '@/lib/exams/model';

const sessionSchema = z.object({
  id: z.string(), examId: z.string(), revision: z.string(), sectionIds: z.array(z.string()).max(30),
  questionIds: z.array(z.string()).min(1).max(200), answers: z.record(z.string(), z.array(z.string()).max(4)),
  flags: z.array(z.string()).max(200), cursor: z.number().int().nonnegative(),
  startedAt: z.number().finite(), deadline: z.number().finite().nullable(),
  ink: z.record(z.string(), z.array(z.string().max(8000).regex(/^M[\d .L]+$/)).max(50)).optional(),
  report: reportSchema.optional(), submittedAt: z.number().finite().optional(),
});
export type ExamSession = z.infer<typeof sessionSchema>;
interface Entry { active?: ExamSession; history: ExamSession[] }
interface Store {
  entries: Record<string, Entry>;
  begin: (key: string, exam: PublicExam, sectionIds: string[], minutes: number) => void;
  answer: (key: string, questionId: string, choices: string[]) => void;
  jump: (key: string, cursor: number) => void;
  flag: (key: string, questionId: string) => void;
  finish: (key: string, id: string, report: ExamReport) => void;
  clear: (key: string) => void;
  addInk: (key: string, questionId: string, path: string) => void;
  clearInk: (key: string) => void;
}
const storageHealth = create<{ error: string }>(() => ({ error: '' }));
const storageError = 'Trình duyệt không lưu được bài làm. Đừng đóng trang trước khi nộp bài.';
const persistedSchema = z.object({ entries: z.record(z.string(), z.object({ active: sessionSchema.optional(), history: z.array(sessionSchema).max(10) })) });
export const useExamStore = create<Store>()(persist((set) => ({
  entries: {},
  addInk: (key, questionId, path) => set(state => {
    const entry = state.entries[key]; const session = entry?.active;
    if (!session || session.report || (session.deadline && Date.now() >= session.deadline) || !session.questionIds.includes(questionId)
      || path.length > 8000 || !/^M[\d .L]+$/.test(path) || Object.values(session.ink ?? {}).reduce((n, paths) => n + paths.length, 0) >= 200) return state;
    const paths = session.ink?.[questionId] ?? []; if (paths.length >= 50) return state;
    return { entries: { ...state.entries, [key]: { ...entry, active: { ...session, ink: { ...session.ink, [questionId]: [...paths, path] } } } } };
  }),
  clearInk: key => set(state => {
    const entry = state.entries[key]; if (!entry?.active || entry.active.report) return state;
    return { entries: { ...state.entries, [key]: { ...entry, active: { ...entry.active, ink: {} } } } };
  }),
  begin: (key, exam, sectionIds, minutes) => {
    const questions = selectedQuestions(exam, sectionIds);
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 180) throw new Error('Thời gian không hợp lệ.');
    const now = Date.now();
    const session: ExamSession = { id: crypto.randomUUID(), examId: exam.examId, revision: exam.revision,
      sectionIds, questionIds: questions.map(q => q.questionId), answers: {}, flags: [], cursor: 0,
      startedAt: now, deadline: minutes ? now + minutes * 60000 : null };
    set(state => ({ entries: { ...state.entries, [key]: { history: state.entries[key]?.history ?? [], active: session } } }));
  },
  answer: (key, questionId, choices) => set(state => {
    const entry = state.entries[key]; const session = entry?.active;
    if (!session || session.report || (session.deadline && Date.now() >= session.deadline) || !session.questionIds.includes(questionId)) return state;
    return { entries: { ...state.entries, [key]: { ...entry, active: { ...session, answers: { ...session.answers, [questionId]: choices } } } } };
  }),
  jump: (key, cursor) => set(state => {
    const entry = state.entries[key]; if (!entry?.active) return state;
    return { entries: { ...state.entries, [key]: { ...entry, active: { ...entry.active, cursor: Math.max(0, Math.min(entry.active.questionIds.length - 1, cursor)) } } } };
  }),
  flag: (key, questionId) => set(state => {
    const entry = state.entries[key]; const session = entry?.active; if (!session || session.report) return state;
    return { entries: { ...state.entries, [key]: { ...entry, active: { ...session,
      flags: session.flags.includes(questionId) ? session.flags.filter(id => id !== questionId) : [...session.flags, questionId] } } } };
  }),
  finish: (key, id, report) => set(state => {
    const entry = state.entries[key]; if (!entry?.active || entry.active.id !== id || entry.active.report) return state;
    const finished = { ...entry.active, report, submittedAt: Date.now() };
    return { entries: { ...state.entries, [key]: { active: finished, history: [finished, ...entry.history].slice(0, 10) } } };
  }),
  clear: key => set(state => ({ entries: { ...state.entries, [key]: { history: state.entries[key]?.history ?? [] } } })),
}), {
  name: 'bu-kanji-exam-practice-v1', partialize: state => ({ entries: state.entries }),
  storage: createJSONStorage(() => ({
    getItem: key => { if (typeof window === 'undefined') return null; try { return window.localStorage.getItem(key); } catch { storageHealth.setState({ error: storageError }); return null; } },
    setItem: (key, value) => { try { window.localStorage.setItem(key, value); storageHealth.setState({ error: '' }); } catch { storageHealth.setState({ error: storageError }); } },
    removeItem: key => { try { window.localStorage.removeItem(key); } catch { storageHealth.setState({ error: storageError }); } },
  })),
  merge: (saved, current) => {
    const parsed = persistedSchema.safeParse(saved);
    if (!parsed.success) { if (saved !== undefined) storageHealth.setState({ error: 'Bài lưu cũ không đọc được. Bạn có thể bắt đầu một lượt mới.' }); return current; }
    return { ...current, entries: parsed.data.entries };
  },
  onRehydrateStorage: () => (_state, error) => { if (error) storageHealth.setState({ error: storageError }); },
}));
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
export function useExamIdentity() {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const userId = useAppStore(state => state.user?.id);
  const authStatus = useAppStore(state => state.authStatus);
  const error = storageHealth(state => state.error);
  return { hydrated: hydrated && authStatus !== 'loading', scope: userId ? `user:${userId}` : 'guest', error };
}
export function examStorageKey(scope: string, examId: string) { return JSON.stringify([scope, examId]); }
