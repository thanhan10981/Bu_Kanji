require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
const { RegisterDto } = require('../dist/auth/dto/register.dto');
const { LoginDto } = require('../dist/auth/dto/login.dto');
test('email canonicalization happens before validation and passwords are unchanged', async () => {
  for (const Type of [RegisterDto, LoginDto]) {
    const dto = plainToInstance(Type, { email: ' A@Example.test ', password: ' password ' });
    assert.equal(dto.email, 'a@example.test'); assert.equal(dto.password, ' password ');
    assert.equal((await validate(dto)).length, 0);
    assert.ok((await validate(plainToInstance(Type, { email: 123, password: 'password' }))).length);
  }
});
test('signup boundaries 8/128, login 1/128, whitelist rejects additional data', async () => {
  for (const n of [0, 7, 8, 128, 129]) {
    assert.equal((await validate(plainToInstance(RegisterDto, { email: 'a@example.test', password: 'a'.repeat(n) }))).length === 0, n >= 8 && n <= 128);
  }
  for (const n of [0, 1, 128, 129]) assert.equal((await validate(plainToInstance(LoginDto, { email: 'a@example.test', password: 'a'.repeat(n) }))).length === 0, n >= 1 && n <= 128);
  assert.ok((await validate(plainToInstance(RegisterDto, { email: 'a@example.test', password: 'password', admin: true }), { whitelist: true, forbidNonWhitelisted: true })).length);
});
