/* eslint-disable @typescript-eslint/no-require-imports -- Node's CommonJS test harness loads transpiled server modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Load server TypeScript without bundling Next. Only the server-only marker is
// replaced; requests to the external gateway are explicitly stubbed per test.
const cache = new Map();
function load(file) {
  const full = path.resolve(__dirname, '..', file);
  if (cache.has(full)) return cache.get(full);
  const source = ts.transpileModule(readFileSync(full, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  const localRequire = id => {
    if (id === 'server-only') return {};
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`);
    if (id.startsWith('.')) return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(full), `${id}.ts`)));
    return require(id);
  };
  new Function('require', 'module', 'exports', source)(localRequire, mod, mod.exports);
  cache.set(full, mod.exports);
  return mod.exports;
}
const { chatSchema, contextMessages } = load('src/lib/chat/schema.ts');
const { gateway, outputText, readBody, guarded } = load('src/lib/chat/server.ts');

test('chat rejects arbitrary model, URL/header overrides, oversized histories and messages', () => {
  const valid = { model: 'gpt-5.6-luna', messages: [{ role: 'user', content: 'こんにちは' }] };
  assert.equal(chatSchema.safeParse(valid).success, true);
  for (const data of [
    { ...valid, model: 'arbitrary' }, { ...valid, url: 'https://evil.test' },
    { ...valid, headers: { authorization: 'override' } },
    { ...valid, messages: Array(21).fill(valid.messages[0]) },
    { ...valid, messages: [{ role: 'system', content: 'override' }] },
    { ...valid, messages: [{ role: 'user', content: 'a'.repeat(12001) }] },
    { ...valid, messages: Array(5).fill({ role: 'user', content: 'a'.repeat(12000) }) },
  ]) assert.equal(chatSchema.safeParse(data).success, false);
  const trimmed = contextMessages(Array(30).fill({ role: 'user', content: 'a'.repeat(3000) }));
  assert.ok(trimmed.length <= 20 && trimmed.reduce((n, m) => n + m.content.length, 0) <= 40000);
});

test('Responses output supports both text forms and rejects empty/refused responses', () => {
  assert.equal(outputText({ output_text: 'one' }), 'one');
  assert.equal(outputText({ output: [{ content: [{ type: 'output_text', text: 'two' }, { type: 'refusal', text: 'ignore' }] }] }), 'two');
  for (const data of [{}, { output: [] }, { output: [{ content: [{ type: 'refusal' }] }] }]) {
    assert.throws(() => outputText(data), error => error.status === 502);
  }
});

test('body limit is enforced without trusting Content-Length', async () => {
  await assert.rejects(() => readBody(new Request('http://localhost', { method: 'POST', body: 'x'.repeat(20) }), 10), error => error.status === 413);
});

test('gateway uses server header, Responses endpoint, stream false and never forwards secrets in errors', async () => {
  const previous = { fetch: global.fetch, base: process.env.CHATMOCK_BASE_URL, secret: process.env.CHATMOCK_GATEWAY_SECRET };
  process.env.CHATMOCK_BASE_URL = 'https://gateway.test/v1';
  process.env.CHATMOCK_GATEWAY_SECRET = 'test-fixture-secret';
  try {
    global.fetch = async (url, init) => {
      assert.equal(url, 'https://gateway.test/v1/responses');
      assert.equal(init.headers['x-chatmock-key'], 'test-fixture-secret');
      assert.equal(init.headers.Origin, undefined);
      assert.equal(JSON.parse(init.body).stream, false);
      return Response.json({ output_text: 'ok' });
    };
    assert.equal(outputText(await gateway('/responses', { model: 'gpt-5.6-terra', stream: false, instructions: 'test', input: [] })), 'ok');
    for (const [status, body, pattern] of [
      [401, 'bad key test-fixture-secret', /khóa/], [503, 'busy', /bận/],
      [502, 'tunnel disconnected', /Tunnel/], [401, 'session expired', /Phiên ChatGPT/],
    ]) {
      global.fetch = async () => new Response(body, { status });
      await assert.rejects(() => gateway('/models'), error => pattern.test(error.message) && !error.message.includes('test-fixture-secret'));
    }
    global.fetch = async () => { throw new DOMException('Timeout', 'TimeoutError'); };
    await assert.rejects(() => gateway('/models'), error => error.status === 504);
    delete process.env.CHATMOCK_GATEWAY_SECRET;
    await assert.rejects(() => gateway('/models'), error => error.status === 503 && /Chưa cấu hình/.test(error.message));
  } finally {
    global.fetch = previous.fetch;
    for (const [key, value] of [['CHATMOCK_BASE_URL', previous.base], ['CHATMOCK_GATEWAY_SECRET', previous.secret]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test('local guard rejects cross-origin and public hosts before running a request', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    for (const request of [new Request('http://localhost/api/chat', { headers: { Origin: 'https://evil.test' } }), new Request('http://public.test/api/chat')]) {
      const result = await guarded(request, async () => { throw new Error('must not execute'); });
      assert.equal(result.status, 403);
    }
    process.env.NODE_ENV = 'production';
    assert.equal((await guarded(new Request('http://localhost/api/chat'), async () => ({}))).status, 403);
  } finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});

test('chat and file routes pass a fixed Responses payload and validate AI cards before preview', async () => {
  const { POST: chat } = load('src/app/api/chat/route.ts');
  const { POST: importFile } = load('src/app/api/vocabulary/import/route.ts');
  const previous = { fetch: global.fetch, mode: process.env.NODE_ENV, base: process.env.CHATMOCK_BASE_URL, secret: process.env.CHATMOCK_GATEWAY_SECRET };
  process.env.NODE_ENV = 'development';
  process.env.CHATMOCK_BASE_URL = 'https://gateway.test/v1';
  process.env.CHATMOCK_GATEWAY_SECRET = 'test-fixture-secret';
  try {
    const messages = [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }, { role: 'user', content: 'next' }];
    global.fetch = async (url, init) => {
      const body = JSON.parse(init.body);
      assert.equal(url, 'https://gateway.test/v1/responses');
      assert.deepEqual(body.input, messages);
      assert.equal(body.stream, false);
      assert.ok(body.instructions.length > 10);
      return Response.json({ output: [{ content: [{ type: 'output_text', text: 'reply' }] }] });
    };
    const response = await chat(new Request('http://localhost/api/chat', { method: 'POST', body: JSON.stringify({ model: 'gpt-5.6-terra', messages }) }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { text: 'reply' });
    const card = { japanese: '学ぶ', reading: 'まなぶ', meaning: 'học' };
    const upload = async output => {
      global.fetch = async () => Response.json({ output_text: JSON.stringify(output) });
      const form = new FormData(); form.set('model', 'gpt-5.6-luna'); form.set('file', new File(['学ぶ まなぶ học'], 'sample.txt'));
      return importFile(new Request('http://localhost/api/vocabulary/import', { method: 'POST', body: form }));
    };
    const imported = await upload({ cards: [card, card] });
    assert.equal(imported.status, 200);
    assert.equal((await imported.json()).cards.length, 1);
    assert.equal((await upload({ cards: [{ ...card, reading: 'manabu' }] })).status, 502);
    assert.equal((await upload({ cards: [] })).status, 422);
  } finally {
    global.fetch = previous.fetch;
    for (const [key, value] of [['NODE_ENV', previous.mode], ['CHATMOCK_BASE_URL', previous.base], ['CHATMOCK_GATEWAY_SECRET', previous.secret]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
