require('reflect-metadata');
const { DataSource } = require('typeorm');
const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

async function isolatedDatabase() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL required; use an isolated local test database');
  const parsed = new URL(url);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) || !/test/i.test(parsed.pathname)
    || url === process.env.DATABASE_URL) throw new Error('Only a separate local test database is allowed');
  const schema = `auth_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new DataSource({ type: 'postgres', url });
  await admin.initialize();
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const db = new DataSource({ type: 'postgres', url, extra: { options: `-c search_path=${schema},public` },
      entities: ['User', 'AuthIdentity', 'RefreshSession', 'EmailVerificationCode', 'PasswordResetToken'].map((name, i) => {
        const files = ['user','auth-identity','refresh-session','email-verification-code','password-reset-token'];
        return require(`../../dist/auth/entities/${files[i]}.entity`)[name];
      }) });
    await db.initialize();
    return { db, schema, async close() { await db.destroy(); await admin.query(`DROP SCHEMA "${schema}" CASCADE`); await admin.destroy(); } };
  } catch (error) { await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await admin.destroy(); throw error; }
}
async function migrate(db) {
  for (const name of ['001_initial_auth.sql', '005_email_password_auth.sql']) {
    await db.query(readFileSync(join(__dirname, '../../database/migrations', name), 'utf8'));
  }
}
// Real TypeORM queries against embedded PostgreSQL; single connection, not a multi-process substitute.
async function embeddedDatabase() {
  const { PGlite } = require('@electric-sql/pglite');
  const { EventEmitter } = require('node:events');
  const engine = new PGlite();
  let tail = Promise.resolve();
  class Pool extends EventEmitter {
    connect(callback) {
      const previous = tail;
      let unlock; tail = new Promise(resolve => { unlock = resolve; });
      previous.then(() => {
        const client = new EventEmitter();
        client.query = async (sql, params) => {
          const result = await engine.query(sql, params);
          return { ...result, rowCount: result.affectedRows ?? result.rows.length };
        };
        callback(null, client, unlock);
      }).catch(error => callback(error));
    }
    end(callback) { if (callback) callback(); }
  }
  const names = ['User', 'AuthIdentity', 'RefreshSession', 'EmailVerificationCode', 'PasswordResetToken'];
  const files = ['user','auth-identity','refresh-session','email-verification-code','password-reset-token'];
  const entities = names.map((name,i) => require(`../../dist/auth/entities/${files[i]}.entity`)[name]);
  entities.push(require('../../dist/auth/entities/login-limit.entity').LoginLimit);
  const db = new DataSource({ type: 'postgres', driver: { Pool }, database: 'postgres', entities,
    installExtensions: false, uuidExtension: 'pgcrypto' });
  try {
    await db.initialize();
    await engine.exec(readFileSync(join(__dirname,'../../database/migrations/001_initial_auth.sql'),'utf8')
      .replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', '').replaceAll('uuid_generate_v4()', 'gen_random_uuid()'));
    await engine.exec(readFileSync(join(__dirname,'../../database/migrations/005_email_password_auth.sql'),'utf8'));
    return { db, engine, async close() { await db.destroy(); await engine.close(); } };
  } catch (error) { await engine.close(); throw error; }
}
function authService(db, overrides = {}) {
  const { AuthService } = require('../../dist/auth/auth.service');
  const { JwtService } = require('@nestjs/jwt');
  const values = { JWT_ACCESS_SECRET: 'a'.repeat(48), JWT_REFRESH_SECRET: 'b'.repeat(48), AUTH_RATE_LIMIT_SECRET: 'c'.repeat(48), FRONTEND_URL:'http://localhost:3000' };
  const config = { get: key => values[key], getOrThrow: key => { if (!values[key]) throw Error('missing config'); return values[key]; } };
  const repo = name => db.getRepository(name);
  const service = new AuthService(repo('User'), repo('AuthIdentity'), repo('RefreshSession'), repo('EmailVerificationCode'), repo('PasswordResetToken'), overrides.jwt ?? new JwtService(), config,
    { sendVerificationCode: async()=>{throw Error('Mail must not be called');}, ...overrides.mail }, overrides.limiter ?? new (require('../../dist/auth/login-limit.service').LoginLimitService)(db,config));
  return { service, config, values };
}
module.exports = { isolatedDatabase, migrate, embeddedDatabase, authService };
