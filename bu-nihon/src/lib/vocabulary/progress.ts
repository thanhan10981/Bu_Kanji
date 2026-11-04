import type { Card } from './schemas.ts';

export type StudyOutcome = 'wrong' | 'correct' | 'corrected';
export interface WordProgress {
  content: string;
  wrongCount: number;
  correctCount: number;
  lastOutcome: StudyOutcome;
  updatedAt: number;
}
export type StudyProgress = Record<string, WordProgress>;
const contentKey = (card: Card) => JSON.stringify([card.japanese, card.reading, card.meaning, card.acceptedReadings ?? []]);
const wordKey = (scope: string, id: string) => JSON.stringify([scope, id]);

export function getWordProgress(progress: StudyProgress, scope: string, card: Card) {
  const entry = progress[wordKey(scope, card.id)];
  // Editing a personal card must not carry mastery over to a different question.
  return entry?.content === contentKey(card) ? entry : undefined;
}
export function recordStudyAttempt(progress: StudyProgress, scope: string, card: Card, outcome: StudyOutcome, now = Date.now()): StudyProgress {
  const previous = getWordProgress(progress, scope, card);
  return { ...progress, [wordKey(scope, card.id)]: {
    content: contentKey(card), wrongCount: (previous?.wrongCount ?? 0) + Number(outcome === 'wrong'),
    correctCount: (previous?.correctCount ?? 0) + Number(outcome === 'correct'),
    lastOutcome: outcome, updatedAt: now,
  } };
}
export function summarizeStudyProgress(progress: StudyProgress, scope: string, cards: Card[]) {
  const words = cards.map(card => ({ card, progress: getWordProgress(progress, scope, card) }));
  const studied = words.filter(word => word.progress).length;
  const mastered = words.filter(word => word.progress?.lastOutcome === 'correct').length;
  const totalWrong = words.reduce((sum, word) => sum + (word.progress?.wrongCount ?? 0), 0);
  const difficult = words.filter((word): word is { card: Card; progress: WordProgress } => Boolean(word.progress?.wrongCount))
    .sort((a, b) => b.progress.wrongCount - a.progress.wrongCount || b.progress.updatedAt - a.progress.updatedAt);
  return { total: cards.length, studied, mastered, unseen: cards.length - studied,
    learning: studied - mastered, totalWrong, difficult,
    percentage: cards.length ? Math.round(mastered / cards.length * 1000) / 10 : 0 };
}
