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
const { chatErrorMessage } = load('src/lib/chat/errors.ts');

test('backend proxy runs after dynamic Next AI routes and preserves backend API paths', async () => {
  const config = load('next.config.ts').default;
  const previous = process.env.API_PROXY_TARGET;
  process.env.API_PROXY_TARGET = 'https://backend.test';
  try {
    const rewrites = await config.rewrites();
    assert.ok(!Array.isArray(rewrites), 'array rewrites would intercept dynamic Next route handlers');
    assert.equal(rewrites.beforeFiles?.length ?? 0, 0);
    assert.equal(rewrites.afterFiles?.length ?? 0, 0);
    assert.deepEqual(rewrites.fallback, [{ source: '/api/:path*', destination: 'https://backend.test/api/:path*' }]);
  } finally {
    if (previous === undefined) delete process.env.API_PROXY_TARGET; else process.env.API_PROXY_TARGET = previous;
  }
});

test('client errors prefer Nest validation details over generic Bad Request labels', () => {
  assert.equal(chatErrorMessage({ message: ['name must be a string', 'size must be an integer'], error: 'Bad Request' }, 400), 'name must be a string\nsize must be an integer');
  assert.equal(chatErrorMessage({ message: 'File quá lớn.', error: 'Bad Request' }, 400), 'File quá lớn.');
  assert.equal(chatErrorMessage({ error: 'Gateway chưa kết nối.' }, 503), 'Gateway chưa kết nối.');
  assert.match(chatErrorMessage({ error: 'Bad Request' }, 400), /Dữ liệu/);
  assert.match(chatErrorMessage(null, 413), /vượt giới hạn/);
});

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

test('guard rejects cross-origin and requires authentication outside local development', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    assert.equal((await guarded(new Request('http://localhost/api/chat', { headers: { Origin: 'https://evil.test' } }), async () => ({}))).status, 403);
    assert.equal((await guarded(new Request('https://public.test/api/chat'), async () => ({}))).status, 401);
    process.env.NODE_ENV = 'production';
    assert.equal((await guarded(new Request('http://localhost/api/chat'), async () => ({}))).status, 401);
  } finally { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous; }
});

test('production chat authenticates with Render and calls gateway without forwarding session cookies', async () => {
  const { POST } = load('src/app/api/chat/route.ts');
  const previousFetch = global.fetch;
  const names = ['NODE_ENV', 'API_PROXY_TARGET', 'CHATMOCK_BASE_URL', 'CHATMOCK_GATEWAY_SECRET'];
  const previous = Object.fromEntries(names.map(key => [key, process.env[key]]));
  Object.assign(process.env, { NODE_ENV: 'production', API_PROXY_TARGET: 'https://backend.test', CHATMOCK_BASE_URL: 'https://gateway.test/v1', CHATMOCK_GATEWAY_SECRET: 'test-fixture-secret' });
  const request = () => new Request('https://app.test/api/chat', { method: 'POST', headers: {
    Origin: 'https://app.test', Cookie: 'access_token=fixture-session; refresh_token=must-not-forward; prefs=private',
  }, body: JSON.stringify({ model: 'gpt-5.6-luna', messages: [{ role: 'user', content: 'hello' }] }) });
  try {
    const calls = [];
    global.fetch = async (url, init) => {
      calls.push(url);
      if (url === 'https://backend.test/api/ai/authorize') {
        assert.equal(init.headers.Cookie, 'access_token=fixture-session');
        assert.equal(init.headers['x-chatmock-key'], undefined);
        assert.equal(init.method, 'POST');
        return Response.json({ allowed: true });
      }
      assert.equal(url, 'https://gateway.test/v1/responses');
      assert.equal(init.headers.Cookie, undefined);
      assert.equal(init.headers.Origin, undefined);
      assert.equal(init.headers['x-chatmock-key'], 'test-fixture-secret');
      return Response.json({ output_text: 'production reply' });
    };
    const response = await POST(request());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { text: 'production reply' });
    assert.deepEqual(calls, ['https://backend.test/api/ai/authorize', 'https://gateway.test/v1/responses']);
    for (const status of [401, 429, 404, 500]) {
      global.fetch = async url => {
        assert.equal(url, 'https://backend.test/api/ai/authorize', 'gateway must not be called after authorization failure');
        return Response.json({ message: 'quota reached' }, { status });
      };
      assert.equal((await POST(request())).status, status === 401 || status === 429 ? status : 503);
    }
    global.fetch = async () => Response.json({ allowed: false });
    assert.equal((await POST(request())).status, 503);
    process.env.API_PROXY_TARGET = 'https://backend.test/path';
    global.fetch = async () => { throw new Error('invalid configuration must not be fetched'); };
    assert.equal((await POST(request())).status, 503);
  } finally {
    global.fetch = previousFetch;
    for (const key of names) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
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

test('large import processes only a bounded stored batch and persists results without accepting client text or URLs', async () => {
  const { POST } = load('src/app/api/vocabulary/import/jobs/[jobId]/[index]/route.ts');
  const previousFetch = global.fetch;
  const names = ['NODE_ENV', 'API_PROXY_TARGET', 'CHATMOCK_BASE_URL', 'CHATMOCK_GATEWAY_SECRET'];
  const previous = Object.fromEntries(names.map(key => [key, process.env[key]]));
  Object.assign(process.env, { NODE_ENV: 'production', API_PROXY_TARGET: 'https://backend.test', CHATMOCK_BASE_URL: 'https://gateway.test/v1', CHATMOCK_GATEWAY_SECRET: 'test-fixture-secret' });
  const id = '00000000-0000-4000-8000-000000000001';
  const context = { params: Promise.resolve({ jobId: id, index: '0' }) };
  const request = () => new Request(`https://app.test/api/vocabulary/import/jobs/${id}/0`, { method: 'POST', headers: { Cookie: 'access_token=session' }, body: JSON.stringify({ url: 'https://evil.test', text: 'client override' }) });
  const cards = [{ japanese: '学校', reading: 'がっこう', meaning: 'trường học' }];
  let stored = null; let gatewayCalls = 0;
  try {
    global.fetch = async (url, init) => {
      if (url === 'https://backend.test/api/ai/authorize') return Response.json({ allowed: true });
      if (url === `https://backend.test/api/ai/imports/${id}/batches/0`) {
        assert.equal(init.headers.Cookie, 'access_token=session');
        if (init.method === 'PUT') { stored = JSON.parse(init.body).cards; return Response.json({ saved: true, cards: stored }); }
        return Response.json({ model: 'gpt-5.6-luna', text: '学校 がっこう trường học', cards: stored });
      }
      assert.equal(url, 'https://gateway.test/v1/responses');
      const body = JSON.parse(init.body);
      assert.equal(body.stream, false);
      assert.ok(body.input[0].content.includes('学校'));
      assert.ok(!body.input[0].content.includes('client override'));
      assert.equal(init.headers.Cookie, undefined);
      gatewayCalls++;
      return Response.json({ output_text: JSON.stringify({ cards }) });
    };
    assert.equal((await POST(request(), context)).status, 200);
    assert.deepEqual(stored, cards);
    assert.equal((await POST(request(), context)).status, 200);
    assert.equal(gatewayCalls, 1, 'completed batch is reused on retry');
    assert.equal((await POST(request(), { params: Promise.resolve({ jobId: '../invalid', index: '0' }) })).status, 400);
  } finally {
    global.fetch = previousFetch;
    for (const key of names) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
  }
});
