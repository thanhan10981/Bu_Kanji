export function normalizeAnswer(value: string) { return value.normalize('NFC').replace(/\s/gu, ''); }
export function isCorrect(answer: string, expected: string) {
  const normalized = normalizeAnswer(answer).replace(/n$/i, 'ん');
  return normalized !== '' && normalized === normalizeAnswer(expected);
}
export function summarize(results: boolean[]) {
  const correct = results.filter(Boolean).length;
  return { total: results.length, correct, wrong: results.length - correct,
    percentage: (results.length ? correct / results.length * 100 : 0).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) };
}

/** A correction is practice, never mastery: requeue it for an independent recall. */
export interface WrittenState {
  queue: number[];
  completed: number[];
  missed: number[];
  results: (boolean | null)[];
  needsCorrection: boolean;
  feedback: 'wrong' | 'correct' | 'corrected' | null;
}
export function startWritten(count: number): WrittenState {
  return { queue: Array.from({ length: count }, (_, i) => i), completed: [], missed: [],
    results: Array.from({ length: count }, () => null), needsCorrection: false, feedback: null };
}
export function gradeWritten(state: WrittenState, correct: boolean): WrittenState {
  const current = state.queue[0];
  if (current === undefined || state.feedback === 'correct' || state.feedback === 'corrected') return state;
  const results = [...state.results];
  if (results[current] === null) results[current] = correct;
  if (!correct) return { ...state, results, needsCorrection: true, feedback: 'wrong',
    missed: state.missed.includes(current) ? state.missed : [...state.missed, current] };
  if (state.needsCorrection) return { ...state, results, feedback: 'corrected' };
  return { ...state, results, feedback: 'correct', completed: [...state.completed, current] };
}
export function advanceWritten(state: WrittenState): WrittenState {
  if (state.feedback !== 'correct' && state.feedback !== 'corrected') return state;
  const [current, ...remaining] = state.queue;
  return { ...state, queue: state.feedback === 'corrected' ? [...remaining, current] : remaining,
    needsCorrection: false, feedback: null };
}
export function matchesCard(answer: string, card: { reading: string; japanese: string; acceptedReadings?: string[] }) {
  const readings = card.acceptedReadings ? [...card.acceptedReadings, card.reading] : card.reading.split('/');
  const spellings = card.japanese.split(/[\/・]/u).filter(Boolean);
  return readings.some(reading => isCorrect(answer, reading))
    || spellings.some(spelling => normalizeAnswer(answer) === normalizeAnswer(spelling));
}
