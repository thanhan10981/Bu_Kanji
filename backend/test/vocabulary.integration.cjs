require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DataSource } = require('typeorm');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { randomUUID } = require('node:crypto');
const { VocabularyService } = require('../dist/vocabulary/vocabulary.service');

test('PostgreSQL CRUD persistence, cross-owner writes, stale counts and cascade', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  if (process.env.TEST_DATABASE_URL === process.env.DATABASE_URL) throw new Error('Use a separate test database');
  const schema = `vocab_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new DataSource({ type: 'postgres', url: process.env.TEST_DATABASE_URL });
  await admin.initialize();
  let db;
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    db = new DataSource({ type: 'postgres', url: process.env.TEST_DATABASE_URL, extra: { options: `-c search_path=${schema},public` } });
    await db.initialize();
    await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await db.query('CREATE TABLE users(id uuid PRIMARY KEY)');
    await db.query(readFileSync(join(__dirname, '../database/migrations/002_vocabulary.sql'), 'utf8'));
    const a = randomUUID(), b = randomUUID();
    await db.query('INSERT INTO users VALUES($1),($2)', [a, b]);
    const service = new VocabularyService(db);
    const folder = await service.createFolder(a, 'N3');
    const sets = [];
    for (let i = 1; i <= 3; i++) sets.push(await service.createSet(a, folder.id, `Bài ${i}`));
    const card = await service.createCard(a, sets[0].id, { meaning: 'ăn', reading: 'たべる', japanese: '食べる' });
    assert.equal((await service.folder(a, folder.id)).setCount, 3);
    assert.equal((await service.set(a, sets[0].id)).cards[0].reading, 'たべる');
    for (const action of [
      () => service.folder(b, folder.id), () => service.set(b, sets[0].id),
      () => service.renameFolder(b, folder.id, 'stolen'), () => service.createSet(b, folder.id, 'stolen'),
      () => service.renameSet(b, sets[0].id, 'stolen'), () => service.createCard(b, sets[0].id, { meaning: 'x', reading: 'あ' }),
      () => service.updateCard(b, card.id, { meaning: 'x', reading: 'あ' }), () => service.deleteCard(b, card.id),
      () => service.deleteFolder(b, folder.id, { expectedSetCount: 3, expectedCardCount: 1 }),
      () => service.deleteSet(b, sets[0].id, { expectedSetCount: 1, expectedCardCount: 1 }),
    ]) await assert.rejects(action, { status: 404 });
    await assert.rejects(() => service.deleteFolder(a, folder.id, { expectedSetCount: 3, expectedCardCount: 0 }), { status: 409 });
    await service.updateCard(a, card.id, { meaning: 'ăn cơm', reading: 'たべる', japanese: '' });
    await db.destroy(); await db.initialize();
    assert.equal((await service.set(a, sets[0].id)).cards[0].meaning, 'ăn cơm');
    await service.deleteFolder(a, folder.id, { expectedSetCount: 3, expectedCardCount: 1 });
    assert.equal((await db.query('SELECT count(*)::int AS count FROM vocab_cards'))[0].count, 0);
  } finally {
    if (db?.isInitialized) await db.destroy();
    await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.destroy();
  }
});
