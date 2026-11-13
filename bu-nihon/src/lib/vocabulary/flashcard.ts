import { z } from 'zod';
import type { Card } from './schemas.ts';

export const flashWordSchema = z.object({ content: z.string(), remembered: z.boolean(), reviews: z.number().int().positive(), updatedAt: z.number().finite().nonnegative() });
export const flashSessionSchema = z.object({
  id: z.string(), revision: z.string(), order: z.array(z.string()).min(1),
  results: z.array(z.boolean()), startedAt: z.number().finite().nonnegative(),
  finishedAt: z.number().finite().nonnegative().nullable(), reverse: z.boolean(),
}).refine(session => new Set(session.order).size === session.order.length && session.results.length <= session.order.length
  && (session.finishedAt !== null) === (session.results.length === session.order.length));
export const flashDataSchema = z.object({
  words: z.record(z.string(), flashWordSchema),
  sessions: z.record(z.string(), flashSessionSchema),
  history: z.record(z.string(), z.array(z.object({
    id: z.string(), total: z.number().int().positive(), remembered: z.number().int().nonnegative(),
    finishedAt: z.number().finite().nonnegative(),
  }).refine(item => item.remembered <= item.total)).max(10)),
});
export type FlashData = z.infer<typeof flashDataSchema>;
export type FlashSession = z.infer<typeof flashSessionSchema>;
export type FlashFilter = 'all' | 'review' | 'unseen';
export const emptyFlashData = (): FlashData => ({ words: {}, sessions: {}, history: {} });
export const flashKey = (scope: string, id: string) => JSON.stringify([scope, id]);
export const flashContent = (card: Card) => JSON.stringify([card.japanese, card.reading, card.meaning, card.acceptedReadings ?? []]);
export const flashRevision = (cards: Card[]) => JSON.stringify(cards.map(card => [card.id, flashContent(card)]));
export function flashWord(data: FlashData, scope: string, card: Card) {
  const word = data.words[flashKey(scope, card.id)];
  return word?.content === flashContent(card) ? word : undefined;
}
export function flashSummary(data: FlashData, scope: string, cards: Card[]) {
  const studied = cards.filter(card => flashWord(data, scope, card));
  const remembered = studied.filter(card => flashWord(data, scope, card)?.remembered).length;
  return { studied: studied.length, remembered, unseen: cards.length - studied.length,
    review: studied.filter(card => !flashWord(data, scope, card)?.remembered),
    reviews: studied.reduce((sum, card) => sum + (flashWord(data, scope, card)?.reviews ?? 0), 0),
    percentage: cards.length ? Math.round(studied.length / cards.length * 100) : 0 };
}
export function createFlashSession(data: FlashData, scope: string, cards: Card[], filter: FlashFilter, reverse: boolean, random = Math.random, now = Date.now()): FlashSession | null {
  const order = cards.filter(card => filter === 'all' || (filter === 'unseen' ? !flashWord(data, scope, card) : flashWord(data, scope, card)?.remembered === false)).map(card => card.id);
  if (!order.length) return null;
  for (let index = order.length - 1; index > 0; index--) {
    const next = Math.floor(random() * (index + 1));
    [order[index], order[next]] = [order[next], order[index]];
  }
  return { id: `${now}-${random()}`, revision: flashRevision(cards), order, results: [], startedAt: now, finishedAt: null, reverse };
}
// The expected card and session prevent stale clicks from rating the next card.
export function rateFlashcard(data: FlashData, scope: string, setId: string, cards: Card[], sessionId: string, cardId: string, remembered: boolean, now = Date.now()): FlashData {
  const key = flashKey(scope, setId);
  const session = data.sessions[key];
  if (!session || session.id !== sessionId || session.finishedAt !== null || session.revision !== flashRevision(cards)
    || session.order[session.results.length] !== cardId) return data;
  const card = cards.find(card => card.id === cardId);
  if (!card) return data;
  const results = [...session.results, remembered];
  const finished = results.length === session.order.length;
  const previous = flashWord(data, scope, card);
  return {
    words: { ...data.words, [flashKey(scope, card.id)]: { content: flashContent(card), remembered, reviews: (previous?.reviews ?? 0) + 1, updatedAt: now } },
    sessions: { ...data.sessions, [key]: { ...session, results, finishedAt: finished ? now : null } },
    history: finished ? { ...data.history, [key]: [{ id: session.id, total: results.length, remembered: results.filter(Boolean).length, finishedAt: now }, ...(data.history[key] ?? [])].slice(0, 10) } : data.history,
  };
}
