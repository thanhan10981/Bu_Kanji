require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { VocabularyService } = require('../dist/vocabulary/vocabulary.service');

test('JSON card imports execute against PostgreSQL and skip duplicates on retry', async () => {
  const pg = new PGlite();
  try {
    await pg.exec('CREATE TABLE users(id uuid PRIMARY KEY); CREATE FUNCTION uuid_generate_v4() RETURNS uuid LANGUAGE SQL AS $$ SELECT gen_random_uuid() $$;');
    await pg.exec(readFileSync(join(__dirname, '../database/migrations/002_vocabulary.sql'), 'utf8'));
    const owner = '00000000-0000-4000-8000-000000000001';
    const foreign = '00000000-0000-4000-8000-000000000002';
    await pg.query('INSERT INTO users VALUES($1),($2)', [owner, foreign]);
    const wrap = db => ({ query: async (sql, params) => (await db.query(sql, params)).rows });
    const service = new VocabularyService({ ...wrap(pg), transaction: action => pg.transaction(tx => action(wrap(tx))) });
    const folder = await service.createFolder(owner, 'JSON');
    const set = await service.createSet(owner, folder.id, 'Từ vựng');
    const card = { meaning: 'ăn', reading: 'たべる', japanese: '食べる' };
    const second = { meaning: 'học', reading: 'まなぶ' };
    await assert.rejects(() => service.importCards(foreign, set.id, [card]), { status: 404 });
    assert.deepEqual(await service.importCards(owner, set.id, [card, card, second]), { imported: 2, skipped: 1 });
    assert.deepEqual(await service.importCards(owner, set.id, [card, second]), { imported: 0, skipped: 2 });
    const stored = (await service.set(owner, set.id)).cards;
    assert.equal(stored.length, 2);
    assert.ok(stored.some(row => row.meaning === card.meaning && row.reading === card.reading && row.japanese === card.japanese));
    assert.ok(stored.some(row => row.meaning === second.meaning && row.japanese === ''));
  } finally { await pg.close(); }
});
