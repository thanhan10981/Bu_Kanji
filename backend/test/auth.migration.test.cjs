const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { isolatedDatabase } = require('./helpers/auth-harness.cjs');
const initial = readFileSync(join(__dirname, '../database/migrations/001_initial_auth.sql'), 'utf8')
  .replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', '').replaceAll('uuid_generate_v4()', 'gen_random_uuid()');
// Embedded PostgreSQL SQL checks; does not establish multi-process PostgreSQL guarantees.
test('migration preserves old data, enforces canonical uniqueness and limit constraints', async () => {
  const db = new PGlite();
  try {
    await db.exec(initial);
    await db.query(`INSERT INTO users(email,"displayName") VALUES (' Old@Example.test ','old')`);
    const sql = readFileSync(join(__dirname, '../database/migrations/005_email_password_auth.sql'), 'utf8');
    await db.exec(sql); await db.exec(sql);
    assert.equal((await db.query('SELECT email FROM users')).rows[0].email, ' Old@Example.test ');
    await assert.rejects(db.query(`INSERT INTO users(email,"displayName") VALUES ('old@example.test','other')`), { code: '23505' });
    await assert.rejects(db.query(`INSERT INTO auth_login_limits VALUES ('email:test',0,now(),now())`), { code: '23514' });
  } finally { await db.close(); }
});
test('preflight refuses canonical duplicates and inconsistent identities without merging', async () => {
  const db = new PGlite();
  try {
    await db.exec(initial);
    const sql = readFileSync(join(__dirname, '../database/migrations/005_email_password_auth.sql'), 'utf8');
    await db.exec(`INSERT INTO users(email,"displayName") VALUES ('A@example.test','a'),('a@example.test','b')`);
    await assert.rejects(db.exec(sql));
    assert.equal((await db.query('SELECT count(*)::int AS n FROM users')).rows[0].n, 2);
    await db.exec(`DELETE FROM users WHERE email='A@example.test'; INSERT INTO auth_identities(provider,"providerAccountId","userId") SELECT 'password','wrong@example.test',id FROM users;`);
    await assert.rejects(db.exec(sql));
  } finally { await db.close(); }
});
test('real PostgreSQL migration runner preserves data and checksum history across reruns', {skip:!process.env.TEST_DATABASE_URL},async()=>{
  const {spawnSync}=require('node:child_process');
  const f=await isolatedDatabase();
  try{
    await f.db.query(readFileSync(join(__dirname,'../database/migrations/001_initial_auth.sql'),'utf8'));
    await f.db.query(`INSERT INTO users(email,"displayName") VALUES (' Legacy@Example.test ','legacy')`);
    const run=()=>spawnSync(process.execPath,[join(__dirname,'../scripts/migrate.cjs')],{
      cwd:join(__dirname,'..'),encoding:'utf8',timeout:30000,
      env:{...process.env,DATABASE_URL:process.env.TEST_DATABASE_URL,DATABASE_SSL:'false',PGOPTIONS:`-c search_path=${f.schema},public`},
    });
    const first=run();assert.equal(first.status,0,'Migration CLI must succeed on isolated local database');
    const history=await f.db.query('SELECT name,checksum FROM schema_migrations ORDER BY name');
    assert.ok(history.length>=5);
    assert.equal(run().status,0);
    assert.deepEqual(await f.db.query('SELECT name,checksum FROM schema_migrations ORDER BY name'),history);
    assert.equal((await f.db.query('SELECT email FROM users'))[0].email,' Legacy@Example.test ');
  }finally{await f.close();}
});
