// Test-only accounts. Never read the app .env or connect to a remote database.
const { Client } = require('pg');
const argon2 = require('argon2');

async function seed() {
  const raw = process.env.TEST_DATABASE_URL;
  if (!raw) throw new Error('Set TEST_DATABASE_URL to the isolated local test database.');
  const url = new URL(raw);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || url.pathname !== '/bu_kanji_vocabulary_test' || url.port !== '55432') {
    throw new Error('Only local bu_kanji_vocabulary_test on port 55432 is allowed.');
  }
  if (url.search || url.hash) throw new Error('Unexpected connection parameters. Use the local test URL from the guide.');
  const client = new Client({ connectionString: raw, connectionTimeoutMillis: 3000 });
  await client.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await argon2.hash('VocabularyTest!2026');
    for (const label of ['a', 'b']) {
      const email = `vocabulary.${label}@example.test`;
      const { rows: [user] } = await client.query(`INSERT INTO users(email,"passwordHash","emailVerified","displayName")
        VALUES($1,$2,true,$3) ON CONFLICT(email) DO UPDATE SET "passwordHash"=EXCLUDED."passwordHash","emailVerified"=true
        RETURNING id`, [email, passwordHash, `Vocabulary Test ${label.toUpperCase()}`]);
      await client.query(`INSERT INTO auth_identities(provider,"providerAccountId","userId") VALUES('password',$1,$2)
        ON CONFLICT(provider,"providerAccountId") DO NOTHING`, [email, user.id]);
    }
    await client.query('COMMIT');
    console.log('Seeded vocabulary.a@example.test and vocabulary.b@example.test in the isolated database.');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { await client.end(); }
}
seed().catch(() => { console.error('Test account setup failed. Check TEST_DATABASE_URL, local PostgreSQL and migrations.'); process.exitCode = 1; });
