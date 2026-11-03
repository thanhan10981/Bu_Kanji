const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateDeployEnv } = require('../scripts/check-deploy-env.cjs');
const { databaseSsl } = require('../scripts/database-ssl.cjs');
test('database TLS policy is shared: verify by default, explicit Render private self-signed opt-in', () => {
  assert.equal(databaseSsl({DATABASE_SSL:'false'}),undefined);
  assert.deepEqual(databaseSsl({DATABASE_SSL:'true'}),{rejectUnauthorized:true});
  assert.deepEqual(databaseSsl({DATABASE_SSL:'true',DATABASE_SSL_REJECT_UNAUTHORIZED:'false'}),{rejectUnauthorized:false});
});
const good = { NODE_ENV:'production', DATABASE_URL:'postgresql://test:test@localhost:55432/example_test', FRONTEND_URL:'https://bu-kanji.vercel.app', JWT_ACCESS_SECRET:'a'.repeat(48), JWT_REFRESH_SECRET:'b'.repeat(48), DATABASE_SSL:'false' };
test('deployment preflight identifies missing values without disclosing secrets', () => {
  const errors = validateDeployEnv({ NODE_ENV:'production' });
  assert.ok(errors.some(e => e.includes('DATABASE_URL')));
  assert.ok(errors.some(e => e.includes('JWT_ACCESS_SECRET')));
  assert.ok(errors.some(e => e.includes('FRONTEND_URL')));
});
test('deployment preflight accepts production and isolated local test origins', () => {
  assert.deepEqual(validateDeployEnv(good), []);
  assert.deepEqual(validateDeployEnv({...good, FRONTEND_URL:'http://127.0.0.1:4310'}), []);
});
test('deployment preflight rejects unsafe/default or inconsistent values', () => {
  for (const override of [{JWT_ACCESS_SECRET:'replace_with_secret'}, {JWT_REFRESH_SECRET:good.JWT_ACCESS_SECRET}, {FRONTEND_URL:'https://bu-kanji.vercel.app/'}, {CORS_ORIGIN:'*'}, {DATABASE_URL:'postgresql://USER:PASSWORD@HOST/DB'}, {DATABASE_SSL:'maybe'}]) {
    assert.ok(validateDeployEnv({...good,...override}).length);
  }
});
