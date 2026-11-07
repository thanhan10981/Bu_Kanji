require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
const { ImportService } = require('../dist/ai/import.service');
const { CreateImportDto, ImportResultDto, IMPORT_MAX_BYTES, IMPORT_PART_BYTES } = require('../dist/ai/import.dto');
const { splitText } = require('../scripts/import-worker.cjs');
const owner = '00000000-0000-4000-8000-000000000001';
const foreign = '00000000-0000-4000-8000-000000000002';

async function setup() {
  const pg = new PGlite();
  await pg.exec('CREATE TABLE users(id uuid PRIMARY KEY); CREATE FUNCTION uuid_generate_v4() RETURNS uuid LANGUAGE SQL AS $$ SELECT gen_random_uuid() $$;');
  await pg.query('INSERT INTO users VALUES($1),($2)', [owner, foreign]);
  await pg.exec(readFileSync(join(__dirname, '../database/migrations/004_ai_imports.sql'), 'utf8'));
  const wrap = db => ({ query: async (sql, params) => (await db.query(sql, params)).rows });
  const db = { ...wrap(pg), transaction: action => pg.transaction(tx => action(wrap(tx))) };
  const service = new ImportService(db);
  return { pg, db, service, close: async () => { await service.onModuleDestroy(); await pg.close(); } };
}

function pdfBytes(targetSize) {
  const content = 'BT /F1 12 Tf 50 740 Td (Vocabulary: taberu means to eat.) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${content.length} >>\nstream\n${content}\nendstream`];
  let prefix = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((value, index) => { offsets.push(Buffer.byteLength(prefix)); prefix += `${index + 1} 0 obj\n${value}\nendobj\n`; });
  offsets.push(Buffer.byteLength(prefix));
  let padding = targetSize - 1000; let suffix; let header;
  for (let i = 0; i < 8; i++) {
    header = `6 0 obj\n<< /Length ${padding} >>\nstream\n`;
    const end = '\nendstream\nendobj\n';
    const xref = Buffer.byteLength(prefix + header) + padding + end.length;
    suffix = end + 'xref\n0 7\n0000000000 65535 f \n' + offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('') + `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const next = targetSize - Buffer.byteLength(prefix + header + suffix);
    if (next === padding) break;
    padding = next;
  }
  const buffer = Buffer.alloc(targetSize, 0x20);
  buffer.write(prefix + header, 0);
  buffer.write(suffix, Buffer.byteLength(prefix + header) + padding);
  return buffer;
}

test('100 MB boundary, model whitelist, and result validation', async () => {
  const valid = { name: 'large.pdf', size: IMPORT_MAX_BYTES, model: 'gpt-5.6-luna', lastModified: 1 };
  assert.equal((await validate(plainToInstance(CreateImportDto, valid))).length, 0);
  for (const override of [{ size: IMPORT_MAX_BYTES + 1 }, { size: 0 }, { model: 'arbitrary' }]) assert.ok((await validate(plainToInstance(CreateImportDto, { ...valid, ...override }))).length);
  assert.equal((await validate(plainToInstance(ImportResultDto, { cards: [] }))).length, 0);
  assert.ok((await validate(plainToInstance(ImportResultDto, { cards: [{ meaning: 'eat', reading: 'taberu' }] }))).length);
});

test('text splitting preserves content and Unicode, supports more than 40,000 characters', () => {
  const text = ('学校 がっこう trường học\n'.repeat(5000) + '語'.repeat(9999) + '𠮷野家').trim();
  const batches = splitText(text);
  assert.ok(batches.length > 4);
  assert.ok(batches.every(batch => batch.length <= 10000 && !/[\uD800-\uDBFF]$/.test(batch)));
  assert.equal(batches.join(''), text);
});

test('PostgreSQL resumable upload checks ownership, sizes, retries, missing parts and expiry', async () => {
  const f = await setup();
  try {
    const created = await f.service.create(owner, { name: 'vocab.txt', size: IMPORT_PART_BYTES + 20, model: 'gpt-5.6-luna', lastModified: 1 });
    const id = created.id;
    for (const action of [() => f.service.status(foreign, id), () => f.service.part(foreign, id, 0, Buffer.alloc(IMPORT_PART_BYTES)), () => f.service.prepare(foreign, id), () => f.service.batch(foreign, id, 0), () => f.service.remove(foreign, id)]) await assert.rejects(action, { status: 404 });
    await assert.rejects(() => f.service.part(owner, id, 2, Buffer.alloc(20)), { status: 400 });
    await assert.rejects(() => f.service.part(owner, id, 0, Buffer.alloc(20)), { status: 400 });
    await f.service.part(owner, id, 0, Buffer.alloc(IMPORT_PART_BYTES));
    await f.service.part(owner, id, 0, Buffer.alloc(IMPORT_PART_BYTES));
    await assert.rejects(() => f.service.part(owner, id, 0, Buffer.alloc(IMPORT_PART_BYTES, 1)), { status: 409 });
    assert.deepEqual((await f.service.status(owner, id)).parts, [0]);
    await assert.rejects(() => f.service.prepare(owner, id), { status: 400 });
    await f.service.part(owner, id, 1, Buffer.alloc(20));
    await f.db.query('UPDATE ai_import_jobs SET "expiresAt"=now()-interval \'1 second\' WHERE id=$1', [id]);
    await assert.rejects(() => f.service.status(owner, id), { status: 404 });
    await f.service.create(owner, { name: 'new.txt', size: 2, model: 'gpt-5.6-luna', lastModified: 1 });
    assert.equal((await f.db.query('SELECT count(*)::int AS n FROM ai_import_parts'))[0].n, 0);
  } finally { await f.close(); }
});

test('real 100 MB PDF uploads in 50 parts, extracts in worker and resumes stored results', { timeout: 180000 }, async () => {
  const f = await setup();
  try {
    const pdf = pdfBytes(IMPORT_MAX_BYTES);
    const { id } = await f.service.create(owner, { name: '100mb.pdf', size: pdf.length, model: 'gpt-5.6-luna', lastModified: 1 });
    for (let index = 0; index < 50; index++) await f.service.part(owner, id, index, pdf.subarray(index * IMPORT_PART_BYTES, (index + 1) * IMPORT_PART_BYTES));
    assert.equal((await f.service.status(owner, id)).parts.length, 50);
    await f.service.prepare(owner, id);
    let status;
    for (let attempt = 0; attempt < 600; attempt++) {
      status = await f.service.status(owner, id);
      if (status.status !== 'extracting') break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(status.status, 'ready', status.error);
    assert.equal(status.total, 1);
    assert.equal(status.totalPages, 1);
    assert.equal(status.parts.length, 0, 'raw file data is purged after extraction');
    const batch = await f.service.batch(owner, id, 0);
    assert.match(batch.text, /taberu/);
    const cards = [{ japanese: '食べる', reading: 'たべる', meaning: 'ăn' }];
    await f.service.result(owner, id, 0, { cards });
    await f.service.result(owner, id, 0, { cards: [] });
    assert.deepEqual((await f.service.batch(owner, id, 0)).cards, cards, 'retry does not overwrite completed work');
    assert.equal((await f.service.status(owner, id)).status, 'completed');
    await f.service.remove(owner, id);
    await assert.rejects(() => f.service.batch(owner, id, 0), { status: 404 });
  } finally { await f.close(); }
});
