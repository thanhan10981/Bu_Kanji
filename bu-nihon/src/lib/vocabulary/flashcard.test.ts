import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFlashSession, emptyFlashData, flashDataSchema, flashKey, flashSummary, rateFlashcard } from './flashcard.ts';
import type { Card } from './schemas.ts';

const cards: Card[] = ['one', 'two', 'three'].map(id => ({ id, setId: 'deck', japanese: id, reading: 'あ', meaning: id, createdAt: '', updatedAt: '' }));
function start(scope = 'guest', setId = 'deck') {
  const data = emptyFlashData();
  const session = createFlashSession(data, scope, cards, 'all', false, () => 0.9, 100)!;
  data.sessions[flashKey(scope, setId)] = session;
  return { data, session };
}
test('flipping alone has no progress; ratings update distinct cards and persist a resumable session', () => {
  const { data, session } = start();
  assert.equal(flashSummary(data, 'guest', cards).studied, 0);
  const rated = rateFlashcard(data, 'guest', 'deck', cards, session.id, 'one', false, 200);
  const restored = flashDataSchema.parse(JSON.parse(JSON.stringify(rated)));
  assert.equal(restored.sessions[flashKey('guest', 'deck')].results.length, 1);
  assert.equal(restored.sessions[flashKey('guest', 'deck')].finishedAt, null);
  assert.deepEqual(flashSummary(restored, 'guest', cards).review.map(card => card.id), ['one']);
  assert.equal(flashSummary(restored, 'guest', cards).unseen, 2);
});
test('stale/double clicks, wrong session and changed content do not rate another card', () => {
  const { data, session } = start();
  const rated = rateFlashcard(data, 'guest', 'deck', cards, session.id, 'one', true);
  assert.equal(rateFlashcard(rated, 'guest', 'deck', cards, session.id, 'one', true), rated);
  assert.equal(rateFlashcard(rated, 'guest', 'deck', cards, 'stale', 'two', true), rated);
  assert.equal(rateFlashcard(rated, 'guest', 'deck', [{ ...cards[0], meaning: 'changed' }, ...cards.slice(1)], session.id, 'two', true), rated);
});
test('completion saved exactly once; review filter follows latest self-assessment', () => {
  const { session, data: initial } = start();
  let data = initial;
  for (const card of cards) data = rateFlashcard(data, 'guest', 'deck', cards, session.id, card.id, card.id !== 'two', 200);
  const key = flashKey('guest', 'deck');
  assert.equal(data.history[key].length, 1);
  assert.equal(data.history[key][0].remembered, 2);
  assert.equal(rateFlashcard(data, 'guest', 'deck', cards, session.id, 'three', true), data);
  const review = createFlashSession(data, 'guest', cards, 'review', true, () => 0.5, 300)!;
  assert.deepEqual(review.order, ['two']);
  data.sessions[key] = review;
  data = rateFlashcard(data, 'guest', 'deck', cards, review.id, 'two', true, 400);
  assert.equal(flashSummary(data, 'guest', cards).remembered, 3);
  assert.equal(flashSummary(data, 'guest', cards).reviews, 4);
  assert.equal(data.history[key].length, 2);
  assert.equal(createFlashSession(data, 'guest', cards, 'review', false), null);
  assert.equal(createFlashSession(data, 'guest', cards, 'unseen', false), null);
});
test('account scopes isolate data; shared library card IDs share progress; edits invalidate individual progress', () => {
  const { data, session } = start();
  const rated = rateFlashcard(data, 'guest', 'deck', cards, session.id, 'one', true);
  assert.equal(flashSummary(rated, 'user:alice', cards).studied, 0);
  assert.equal(flashSummary(rated, 'guest', [{ ...cards[0], setId: 'review' }]).remembered, 1);
  assert.equal(flashSummary(rated, 'guest', [{ ...cards[0], meaning: 'changed' }]).studied, 0);
  assert.equal(flashSummary(rated, 'guest', cards.slice(1)).studied, 0);
});
test('invalid saved sessions are rejected instead of resuming beyond the card queue', () => {
  const { data } = start();
  const key = flashKey('guest', 'deck');
  data.sessions[key].results = [true, true, true, true];
  assert.equal(flashDataSchema.safeParse(data).success, false);
});
