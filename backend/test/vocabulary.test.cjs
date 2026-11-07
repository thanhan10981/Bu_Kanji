require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
const { CardDto, NameDto, ImportCardsDto } = require('../dist/vocabulary/vocabulary.dto');
const { VocabularyService } = require('../dist/vocabulary/vocabulary.service');
const { safeReturnPath } = require('../dist/auth/return-path');
const { JwtCookieGuard } = require('../dist/auth/auth.guard');
const { JwtService } = require('@nestjs/jwt');
const { authCapabilities } = require('../dist/auth/capabilities');

test('auth capabilities expose booleans only and disable unavailable providers', () => {
  assert.deepEqual(authCapabilities(() => undefined), {emailRegistration:true,passwordReset:false,googleLogin:false});
  const env={NODE_ENV:'production',RESEND_API_KEY:'re_test_key',RESEND_FROM_EMAIL:'Bu Kanji <onboarding@resend.dev>'};
  assert.equal(authCapabilities(k=>env[k]).passwordReset,false);
  env.RESEND_FROM_EMAIL='Bu Kanji <auth@verified.test>';
  assert.equal(authCapabilities(k=>env[k]).emailRegistration,true);
  env.GOOGLE_CLIENT_ID='configured'; env.GOOGLE_CLIENT_SECRET='configured';
  assert.equal(authCapabilities(k=>env[k]).googleLogin,false);
  env.GOOGLE_CALLBACK_URL='https://app.verified.test/api/auth/google/callback';
  assert.equal(authCapabilities(k=>env[k]).googleLogin,true);
});

test('cookie guard rejects missing/tampered tokens and supplies authenticated identity', async () => {
  const jwt = new JwtService();
  const secret = 'unit-test-only-not-a-deployment-secret';
  const guard = new JwtCookieGuard({ getAllAndOverride: () => false }, jwt,
    { getOrThrow: () => secret }, { getAuthenticatedUser: async id => ({ id }) });
  const request = { method: 'GET', cookies: {} };
  const context = { getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => request }) };
  await assert.rejects(() => guard.canActivate(context), { status: 401 });
  request.cookies.access_token = 'tampered';
  await assert.rejects(() => guard.canActivate(context), { status: 401 });
  request.cookies.access_token = await jwt.signAsync({ sub: 'A', type: 'access' }, { secret });
  assert.equal(await guard.canActivate(context), true);
  assert.equal(request.user.id, 'A');
});

test('OAuth return path permits vocabulary only and rejects redirects/encoded tricks', () => {
  assert.equal(safeReturnPath('/vocabulary/sets/abc?mode=written'), '/vocabulary/sets/abc?mode=written');
  for (const path of [undefined, 'https://evil.test', '//evil.test', '/vocabulary/../../evil', '/vocabularyevil', '/vocabulary/\\evil', '/vocabulary/%2f%2fevil', '/vocabulary/%0aevil']) assert.equal(safeReturnPath(path), '/kanji');
});

test('card validation requires meaning and hiragana; normalizes Unicode whitespace', async () => {
  const card = plainToInstance(CardDto, { meaning: ' ăn ', reading: ' が っこう　', japanese: '学校' });
  assert.equal((await validate(card)).length, 0);
  assert.equal(card.reading, 'がっこう');
  for (const reading of ['', 'taberu', 'タベル', '食べる']) {
    assert.ok((await validate(plainToInstance(CardDto, { meaning: 'ăn', reading }))).length);
  }
  assert.ok((await validate(plainToInstance(NameDto, { name: '   ' }))).length);
  assert.ok((await validate(plainToInstance(NameDto, { name: 'a'.repeat(121) }))).length);
});

test('foreign parent cannot be read or mutated; ownership bound as SQL parameter', async () => {
  const seen = [];
  const manager = { query: async (sql, params) => { seen.push([sql, params]); return []; } };
  const service = new VocabularyService({ ...manager, transaction: fn => fn(manager) });
  const card = { meaning: 'x', reading: 'あ' };
  const counts = { expectedSetCount: 1, expectedCardCount: 1 };
  for (const action of [
    () => service.folder('B', 'foreign'), () => service.set('B', 'foreign'),
    () => service.renameFolder('B', 'foreign', 'x'), () => service.createSet('B', 'foreign', 'x'),
    () => service.renameSet('B', 'foreign', 'x'), () => service.createCard('B', 'foreign', card),
    () => service.importCards('B', 'foreign', [card]),
    () => service.updateCard('B', 'foreign', card), () => service.deleteCard('B', 'foreign'),
    () => service.deleteFolder('B', 'foreign', counts), () => service.deleteSet('B', 'foreign', counts),
  ]) await assert.rejects(action, { status: 404 });
  assert.ok(seen.every(([sql, params]) => sql.includes('"ownerId"') && params.includes('B')));
});

test('batch import validates every card and limits count to 200', async () => {
  const card = { meaning: 'học', reading: 'まなぶ', japanese: '学ぶ' };
  assert.equal((await validate(plainToInstance(ImportCardsDto, { cards: [card] }))).length, 0);
  for (const cards of [[], Array(201).fill(card), [{ ...card, reading: 'manabu' }], [{ ...card, meaning: '' }]]) {
    assert.ok((await validate(plainToInstance(ImportCardsDto, { cards }))).length);
  }
});

test('batch import holds the folder transaction lock and skips duplicate rows', async () => {
  const seen = [];
  const inserted = new Set();
  let locked = false;
  const manager = { query: async (sql, params) => {
    seen.push(sql);
    if (sql.includes('pg_advisory')) { locked = true; return []; }
    if (sql.startsWith('INSERT')) {
      assert.equal(locked, true);
      assert.ok(sql.includes('WHERE NOT EXISTS'));
      const created = new Set();
      for (let index = 0; index < params.length; index += 4) {
        const key = JSON.stringify(params.slice(index, index + 4));
        if (!inserted.has(key)) { inserted.add(key); created.add(key); }
      }
      return [...created].map(() => ({ id: 'created' }));
    }
    return [{ id: 'folder' }];
  }};
  let transactions = 0;
  const service = new VocabularyService({ transaction: fn => { transactions++; return fn(manager); } });
  const card = { meaning: 'học', reading: 'まなぶ', japanese: '学ぶ' };
  assert.deepEqual(await service.importCards('A', 'set', [card, card]), { imported: 1, skipped: 1 });
  assert.equal(transactions, 1);
  assert.ok(seen[0].includes('"ownerId"'));
  assert.deepEqual(await service.importCards('A', 'set', [card]), { imported: 0, skipped: 1 });
});

test('folder delete with stale counts rejects instead of cascading unconfirmed cards', async () => {
  const manager = { query: async sql => {
    if (sql.includes('pg_advisory')) return [];
    if (sql.includes('count(')) return [{ id: 'folder', name: 'N3', setCount: 3, cardCount: 4 }];
    return [{ id: 'folder' }];
  }};
  const service = new VocabularyService({ ...manager, transaction: fn => fn(manager) });
  await assert.rejects(() => service.deleteFolder('A', 'folder', { expectedSetCount: 3, expectedCardCount: 3 }), { status: 409 });
});
