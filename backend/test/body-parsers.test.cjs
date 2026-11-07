require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NestFactory } = require('@nestjs/core');
const { Module, Controller, Post, Body, ValidationPipe } = require('@nestjs/common');
const { ImportController } = require('../dist/ai/import.controller');
const { ImportService } = require('../dist/ai/import.service');
const { configureBodyParsers } = require('../dist/body-parsers');

// Exercise the application's actual parser setup through HTTP, not DTO calls.
class EchoController {
  login(body) { return body; }
  save(body) { return body; }
}
Controller()(EchoController);
for (const [name, path] of [['login', 'auth/login'], ['save', 'vocabulary/sets/:id/import']]) {
  Post(path)(EchoController.prototype, name, Object.getOwnPropertyDescriptor(EchoController.prototype, name));
  Body()(EchoController.prototype, name, 0);
}
const id = '00000000-0000-4000-8000-000000000001';
const received = [];
const service = {
  create: async (owner, body) => { received.push({ owner, body }); return { id }; },
  part: async (owner, job, index, body) => {
    assert.ok(Buffer.isBuffer(body));
    assert.equal(owner, id); assert.equal(job, id); assert.equal(index, 0);
    return { bytes: body.length };
  },
  result: async (_owner, _job, _index, body) => ({ count: body.cards.length }),
};
class TestModule {}
Module({ controllers: [ImportController, EchoController], providers: [{ provide: ImportService, useValue: service }] })(TestModule);

test('HTTP JSON fallback preserves import/auth bodies while scoped parsers retain their limits', async t => {
  const app = await NestFactory.create(TestModule, { logger: false });
  configureBodyParsers(app);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalGuards({ canActivate(context) { context.switchToHttp().getRequest().user = { id }; return true; } });
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const json = (path, body, method = 'POST') => fetch(`${base}/api/${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    await t.test('valid Vietnamese PDF metadata reaches create handler', async () => {
      const body = { name: 'TỪ VỰNG 50 BÀI NIHONGO (2).pdf', size: 104857600, lastModified: 1730000000000, model: 'gpt-5.6-luna' };
      const response = await json('ai/imports', body);
      assert.equal(response.status, 201, JSON.stringify(await response.clone().json()));
      assert.deepEqual(await response.json(), { id });
      assert.deepEqual({ ...received.at(-1).body }, body);
    });
    await t.test('ordinary JSON auth endpoints retain email/password fields', async () => {
      const body = { email: 'fixture@example.test', password: 'test-fixture-password' };
      const response = await json('auth/login', body);
      assert.equal(response.status, 201);
      assert.deepEqual(await response.json(), body);
    });
    await t.test('invalid metadata is still rejected before the service', async () => {
      const before = received.length;
      const response = await json('ai/imports', { name: 'invalid.pdf', size: 104857601, lastModified: 1, model: 'invalid' });
      assert.equal(response.status, 400);
      assert.ok(Array.isArray((await response.json()).message));
      assert.equal(received.length, before);
    });
    await t.test('binary parts remain Buffers and accept the full 2 MB', async () => {
      const response = await fetch(`${base}/api/ai/imports/${id}/parts/0`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: Buffer.alloc(2 * 1024 * 1024, 1) });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { bytes: 2 * 1024 * 1024 });
    });
    const cards = Array.from({ length: 200 }, () => ({ japanese: '学校', reading: 'がっこう', meaning: 'á'.repeat(450) }));
    await t.test('AI results and vocabulary batches above 100 KB use the scoped 1 MB limit', async () => {
      assert.ok(Buffer.byteLength(JSON.stringify({ cards })) > 100 * 1024);
      const result = await json(`ai/imports/${id}/batches/0`, { cards }, 'PUT');
      assert.equal(result.status, 200, JSON.stringify(await result.clone().json()));
      assert.deepEqual(await result.json(), { count: 200 });
      const saved = await json(`vocabulary/sets/${id}/import`, { cards });
      assert.equal(saved.status, 201);
      assert.equal((await saved.json()).cards.length, 200);
    });
    await t.test('other JSON routes still reject payloads above 100 KB', async () => {
      const response = await json('auth/login', { cards });
      assert.equal(response.status, 413);
    });
  } finally { await app.close(); }
});
