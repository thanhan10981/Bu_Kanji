import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editKana, finalizeKana, type KanaState } from './kana.ts';
import { isCorrect, summarize } from './study.ts';

function type(text: string, initial: KanaState = { value: '', caret: 0 }) {
  let state = initial;
  for (const char of text) state = editKana(state, state.value.slice(0, state.caret) + char + state.value.slice(state.caret), state.caret + 1, 'insertText');
  return state;
}
test('C01 streams taberu and retains partial syllables', () => {
  let state: KanaState = { value: '', caret: 0 };
  for (const [i, expected] of ['t', 'た', 'たb', 'たべ', 'たべr', 'たべる'].entries()) {
    state = type('taberu'[i], state); assert.equal(state.value, expected);
  }
});
test('C02-C08 contracted, doubled, n/nn and final n', () => {
  for (const [raw, kana] of Object.entries({ gakkou: 'がっこう', gakk: 'がっk', benkyou: 'べんきょう', benky: 'べんky', kyo: 'きょ', ky: 'ky', na: 'な', nya: 'にゃ', nna: 'んな', kan: 'かn', kani: 'かに', kann: 'かん', kanna: 'かんな' })) assert.equal(type(raw).value, kana, raw);
  assert.equal(finalizeKana(type('kan').value), 'かん');
});
test('C09-C13 deletion, middle insertion, replacement and hiragana paste', () => {
  let state = editKana({ value: 'きょk', caret: 3 }, 'きょ', 2, 'deleteContentBackward');
  assert.equal(type('u', state).value, 'きょう');
  state = editKana({ value: 'たべる', caret: 3 }, 'たべ', 2, 'deleteContentBackward');
  assert.equal(type('ru', state).value, 'たべる');
  state = type('be', { value: 'たる', caret: 1 });
  assert.equal(state.value, 'たべる'); assert.equal(state.caret, 2);
  state = editKana({ value: 'たべる', caret: 2 }, 'たbる', 2, 'insertText');
  assert.equal(type('e', state).value, 'たべる');
  assert.equal(editKana({ value: '', caret: 0 }, 'たべる', 3, 'insertFromPaste').value, 'たべる');
  assert.equal(editKana({ value: 'たる', caret: 1 }, 'たべる', 2, 'insertFromPaste').caret, 2);
  assert.equal(editKana(type('nn'), 'ん', 1, 'deleteContentBackward').nn, undefined);
});
test('normalization, incorrect script, grading and retry source', () => {
  assert.ok(isCorrect(' が っこう　', 'がっこう'));
  assert.ok(isCorrect('かn', 'かん'));
  for (const value of ['がこう', 'ガッコウ', '学校']) assert.equal(isCorrect(value, 'がっこう'), false);
  const result = summarize([true, false, true]);
  assert.deepEqual(result, { total: 3, correct: 2, wrong: 1, percentage: '66,7' });
});
