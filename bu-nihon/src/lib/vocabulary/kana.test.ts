import { test } from 'node:test';
import assert from 'node:assert/strict';
import { editKana, finalizeKana, type KanaState } from './kana.ts';
import { advanceWritten, gradeWritten, isCorrect, matchesCard, startShuffledWritten, startWritten, summarize } from './study.ts';
import { libraryCards, librarySets, getLibrarySet, quizletCards, quizletSets, quizletReview } from './library.ts';

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

test('loanword readings support small vowels and the long vowel mark', () => {
  for (const [raw, reading] of Object.entries({ boranthia: 'ぼらんてぃあ', aidhia: 'あいでぃあ',
    'kurasume-to': 'くらすめーと' })) assert.equal(type(raw).value, reading);
});
test('normalization, incorrect script, grading and retry source', () => {
  assert.ok(isCorrect(' が っこう　', 'がっこう'));
  assert.ok(isCorrect('かn', 'かん'));
  for (const value of ['がこう', 'ガッコウ', '学校']) assert.equal(isCorrect(value, 'がっこう'), false);
  const result = summarize([true, false, true]);
  assert.deepEqual(result, { total: 3, correct: 2, wrong: 1, percentage: '66,7' });
});

test('wrong answer requires correction, then requeues without awarding mastery', () => {
  let session = startWritten(2);
  session = gradeWritten(session, false);
  assert.deepEqual(session.queue, [0, 1]);
  assert.deepEqual(session.completed, []);
  assert.equal(advanceWritten(session), session, 'cannot skip a wrong answer');
  session = gradeWritten(session, false);
  assert.deepEqual(session.missed, [0], 'repeated errors do not duplicate the word');
  session = gradeWritten(session, true);
  assert.equal(session.feedback, 'corrected');
  assert.deepEqual(session.completed, []);
  session = advanceWritten(session);
  assert.deepEqual(session.queue, [1, 0]);
  session = advanceWritten(gradeWritten(session, true));
  assert.deepEqual(session.completed, [1]);
  assert.deepEqual(session.queue, [0]);
  session = advanceWritten(gradeWritten(session, true));
  assert.deepEqual(session.queue, []);
  assert.deepEqual(session.completed, [1, 0]);
  assert.deepEqual(session.results, [false, true], 'first attempt scores remain accurate');
});

test('shuffled sessions keep every card once and use a fresh random order per start', () => {
  const first = startShuffledWritten(60, () => 0);
  const second = startShuffledWritten(60, () => 0.5);
  assert.deepEqual([...first.queue].sort((a, b) => a - b), Array.from({ length: 60 }, (_, i) => i));
  assert.notDeepEqual(first.queue, second.queue);
  assert.equal(first.completed.length, 0);
  const current = first.queue[0];
  const corrected = advanceWritten(gradeWritten(gradeWritten(first, false), true));
  assert.deepEqual(corrected.queue, [...first.queue.slice(1), current]);
  assert.deepEqual(corrected.completed, []);
  const graded = gradeWritten(second, true);
  assert.equal(graded.results[second.queue[0]], true, 'grade remains attached to the actual card');
  assert.deepEqual(graded.completed, [second.queue[0]]);
  assert.deepEqual(startWritten(3).queue, [0, 1, 2], 'original source ordering is unchanged');
  assert.deepEqual(startShuffledWritten(0).queue, []);
  assert.deepEqual(startShuffledWritten(1).queue, [0]);
});

test('one-word correction still needs a fresh recall; repeated failure requeues again', () => {
  let session = startWritten(1);
  for (let i = 0; i < 3; i++) {
    session = advanceWritten(gradeWritten(gradeWritten(session, false), true));
    assert.deepEqual(session.queue, [0]);
    assert.deepEqual(session.completed, []);
  }
  session = gradeWritten(session, true);
  assert.equal(gradeWritten(session, true), session, 'double submit cannot award twice');
  session = advanceWritten(session);
  assert.deepEqual(session.completed, [0]);
  assert.deepEqual(session.queue, []);
});

test('accepts reading or saved Japanese variants, not arbitrary homophones', () => {
  const card = { reading: 'かわる', japanese: '替わる/代わる/換わる' };
  for (const answer of ['かわる', '替わる', '代わる', '換わる']) assert.ok(matchesCard(answer, card));
  assert.equal(matchesCard('変わる', card), false);
  const variants = { reading: 'すませる/すます', japanese: '済ませる/済ます' };
  for (const answer of ['すませる', 'すます', '済ます']) assert.ok(matchesCard(answer, variants));
});

test('all 882 image entries are available across 15 lessons with kana readings', () => {
  assert.equal(libraryCards.length, 882);
  assert.equal(librarySets.length, 15);
  assert.equal(librarySets.flatMap(set => set.cards).length, 882);
  assert.equal(new Set(libraryCards.map(card => card.id)).size, 882);
  assert.equal(librarySets.at(-1)?.cardCount, 42);
  for (const card of libraryCards) {
    assert.ok(card.japanese && card.meaning && card.reading, card.id);
    assert.ok(card.reading.split('/').every(reading => /^[ぁ-ゖー]+$/u.test(reading)), card.japanese);
    assert.ok(matchesCard(card.reading.split('/')[0], card), card.japanese);
    assert.ok(getLibrarySet(card.setId)?.cards.some(item => item.id === card.id));
  }
  for (const word of ['男性', '注文', 'アイデア/アイディア', 'もしかして', 'もしかしたら', 'もしかすると', 'タイトル', 'テーマ', 'つまり']) assert.ok(libraryCards.some(card => card.japanese === word), word);
  assert.equal(libraryCards.find(card => card.japanese === 'クラスメート')?.reading, 'くらすめーと');
});

test('all 707 PDF cards retain order, examples and unique IDs across 12 lessons', () => {
  assert.equal(quizletCards.length, 707);
  assert.equal(quizletSets.length, 12);
  assert.equal(quizletSets.at(-1)?.cardCount, 47);
  assert.equal(quizletReview.cardCount, 707);
  assert.equal(quizletCards[0].japanese, '計算');
  assert.equal(quizletCards.at(-1)?.japanese, '～より～ほうが');
  assert.ok(quizletCards.at(-1)?.meaning.endsWith('Đặt nhanh hơn tốt hơn đặt quá chậm.'));
  assert.equal(new Set([...libraryCards, ...quizletCards].map(card => card.id)).size, 1589);
  assert.equal(quizletSets.flatMap(set => set.cards).length, 707);
  assert.equal(new Set(quizletCards.map(card => card.sourcePage)).size, 36);
  for (const card of quizletCards) {
    assert.ok(card.japanese && card.reading && card.meaning && card.sourcePage);
    assert.ok(card.acceptedReadings?.length, card.japanese);
    for (const reading of card.acceptedReadings ?? []) {
      assert.match(reading, /^[ぁ-ゖー]+$/u);
      assert.ok(matchesCard(reading, card), card.japanese);
    }
    assert.ok(getLibrarySet(card.setId)?.cards.some(item => item.id === card.id));
  }
});

test('PDF annotated readings remain typeable without placeholder symbols', () => {
  const find = (japanese: string) => quizletCards.find(card => card.japanese === japanese)!;
  assert.ok(matchesCard('な', find('名')));
  assert.ok(matchesCard('めい', find('名')));
  assert.ok(matchesCard('いい', find('良い')));
  assert.ok(matchesCard('よい', find('良い')));
  assert.ok(matchesCard('にてほしい', find('～にVてほしい')));
  assert.ok(matchesCard('てから', find('Vてから + B')));
  assert.ok(matchesCard('といい', find('Vる + といい')));
  assert.ok(matchesCard('ているあいだに', find('～ている間に')));
  assert.ok(matchesCard('～ているあいだに', find('～ている間に')));
  assert.equal(matchesCard('ちがう', find('計算')), false);
});
