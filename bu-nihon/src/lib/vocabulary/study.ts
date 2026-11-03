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
