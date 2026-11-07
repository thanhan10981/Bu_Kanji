require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AiService } = require('../dist/ai/ai.service');
const { AiController } = require('../dist/ai/ai.controller');
const { IS_PUBLIC_KEY } = require('../dist/auth/public.decorator');

function fixture(values = {}) {
  const counters = new Map();
  const calls = [];
  const db = { transaction: async action => {
    const snapshot = new Map(counters);
    try {
      return await action({ query: async (sql, params) => {
        calls.push([sql, params]);
        if (sql.includes('CURRENT_TIMESTAMP AS now')) return [{ now: '2026-11-07T12:00:00Z' }];
        if (sql.startsWith('INSERT')) {
          assert.ok(sql.includes('ON CONFLICT'));
          assert.ok(sql.includes('WHERE ai_usage.requests < $3'));
          const key = `${params[0]}:${params[1].toISOString()}`;
          const count = counters.get(key) ?? 0;
          if (count >= params[2]) return [];
          counters.set(key, count + 1); return [{ requests: count + 1 }];
        }
        return [];
      } });
    } catch (error) { counters.clear(); for (const [key, count] of snapshot) counters.set(key, count); throw error; }
  } };
  return { service: new AiService(db, { get: key => values[key] }), counters, calls };
}

test('AI authorization endpoint uses existing authentication and identity', async () => {
  assert.notEqual(Reflect.getMetadata(IS_PUBLIC_KEY, AiController), true);
  assert.notEqual(Reflect.getMetadata(IS_PUBLIC_KEY, AiController.prototype.authorize), true);
  const controller = new AiController({ authorize: async id => ({ userId: id }) });
  assert.deepEqual(await controller.authorize({ id: 'authenticated-user' }), { userId: 'authenticated-user' });
});

test('quotas reserve per-user minute/day and shared global day inside one locked transaction', async () => {
  const { service, calls, counters } = fixture();
  assert.deepEqual(await service.authorize('userA'), { allowed: true });
  assert.ok(calls[0][0].includes('pg_advisory_xact_lock'));
  const inserts = calls.filter(([sql]) => sql.startsWith('INSERT')).map(([, params]) => params);
  assert.deepEqual(inserts.map(p => [p[0], p[2]]), [['user-minute:userA', 12], ['user-day:userA', 100], ['global-day', 1000]]);
  assert.equal(counters.size, 3);
});

test('one user reaching quota does not block another user; global cap blocks both', async () => {
  const { service } = fixture({ AI_REQUESTS_PER_MINUTE: '1', AI_REQUESTS_PER_DAY: '10', AI_GLOBAL_REQUESTS_PER_DAY: '2' });
  await service.authorize('userA');
  await assert.rejects(() => service.authorize('userA'), { status: 429 });
  await service.authorize('userB');
  await assert.rejects(() => service.authorize('userC'), { status: 429 });
});

test('daily rejection rolls back earlier reservations and invalid config fails closed', async () => {
  const { service, counters } = fixture({ AI_REQUESTS_PER_DAY: '1' });
  await service.authorize('userA');
  const snapshot = [...counters];
  await assert.rejects(() => service.authorize('userA'), { status: 429 });
  assert.deepEqual([...counters], snapshot);
  for (const value of ['0', '-1', 'invalid', '1.5']) {
    await assert.rejects(() => fixture({ AI_REQUESTS_PER_DAY: value }).service.authorize('A'), { status: 503 });
  }
});
