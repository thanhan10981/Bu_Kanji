const { Client } = require('pg');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { createHash } = require('node:crypto');
require('@nestjs/config').ConfigModule.forRoot();

async function migrate() {
  const client = new Client({
    ...(process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {
      host: process.env.POSTGRES_HOST, port: Number(process.env.POSTGRES_PORT || 5432),
      user: process.env.POSTGRES_USER, password: process.env.POSTGRES_PASSWORD, database: process.env.POSTGRES_DB,
    }),
    ...(process.env.DATABASE_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {}),
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(81234001)');
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const directory = join(__dirname, '../database/migrations');
    for (const name of readdirSync(directory).filter(n => /^\d+.*\.sql$/.test(n)).sort()) {
      const sql = readFileSync(join(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query('SELECT checksum FROM schema_migrations WHERE name=$1', [name]);
      if (existing.rows.length) {
        if (existing.rows[0].checksum !== checksum) throw new Error(`Migration changed after application: ${name}`);
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)', [name, checksum]);
      console.log(`Applied ${name}`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { await client.end(); }
}
migrate().catch(error => {
  const code = typeof error?.code === 'string' && /^[A-Z0-9_]+$/.test(error.code) ? ` (${error.code})` : '';
  console.error(`Migration failed${code}. No successful migration was confirmed. Check database connectivity, schema and migration history.`);
  process.exitCode = 1;
});
