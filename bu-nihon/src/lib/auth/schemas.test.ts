import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signupSchema, loginSchema } from './schemas.ts';

test('signup boundaries, canonical email and unchanged password', () => {
  for (const n of [0, 7, 8, 128, 129]) assert.equal(signupSchema.safeParse({ email: ' A@Example.test ', password: 'x'.repeat(n) }).success, n >= 8 && n <= 128);
  const data = signupSchema.parse({ email: ' A@Example.test ', password: ' password ' });
  assert.equal(data.email, 'a@example.test'); assert.equal(data.password, ' password ');
  for (const email of ['', 'not-mail', 123]) assert.equal(signupSchema.safeParse({ email, password: 'password' }).success, false);
  assert.match(signupSchema.safeParse({email:'bad',password:'x'}).error!.issues[0].message, /Email/);
});
test('login permits legacy short passwords and rejects invalid length', () => {
  for (const n of [0, 1, 128, 129]) assert.equal(loginSchema.safeParse({ email: 'a@example.test', password: 'x'.repeat(n) }).success, n >= 1 && n <= 128);
});
