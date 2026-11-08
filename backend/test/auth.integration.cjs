const { test } = require('node:test');
const assert = require('node:assert/strict');
const { embeddedDatabase, isolatedDatabase, migrate, authService } = require('./helpers/auth-harness.cjs');
const argon2 = require('argon2');

async function registrationChecks(fixture) {
  const { db } = fixture;
  const { service } = authService(db);
  const password = ' unchanged password ';
  const session = await service.register(' A@Example.test ', password);
  assert.equal(session.user.email, 'a@example.test'); assert.equal(session.user.emailVerified, false);
  assert.equal(session.user.passwordHash, undefined); assert.ok(session.refreshToken);
  const a = (await db.query('SELECT * FROM users'))[0];
  assert.match(a.passwordHash, /^\$argon2id\$v=19\$m=65536,t=3,p=4\$/);
  assert.equal(await argon2.verify(a.passwordHash, password), true);
  await service.register('b@example.test', password);
  const b = (await db.query(`SELECT * FROM users WHERE email='b@example.test'`))[0];
  assert.notEqual(a.passwordHash,b.passwordHash);
  const race = await Promise.allSettled([service.register('Race@example.test',password),service.register(' race@example.test ',password)]);
  assert.equal(race.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(race.find(r=>r.status==='rejected').reason.status,409);
  assert.equal((await db.query('SELECT count(*)::int n FROM users'))[0].n,3);
  assert.equal((await db.query('SELECT count(*)::int n FROM refresh_sessions WHERE "tokenHash"=\'\''))[0].n,0);
  const { service: failing } = authService(db, {jwt:{signAsync:async()=>{throw Error('signing failed');}}});
  await assert.rejects(failing.register('fail@example.test',password), {status:503});
  assert.equal((await db.query(`SELECT count(*)::int n FROM users WHERE email='fail@example.test'`))[0].n,0);
  const originalHash=argon2.hash;let hashes=0;
  try{
    argon2.hash=async(...args)=>{if(++hashes===2)throw Error('refresh hashing failed');return originalHash(...args);};
    await assert.rejects(service.register('hash-fail@example.test',password),{status:503});
  }finally{argon2.hash=originalHash;}
  assert.equal((await db.query(`SELECT count(*)::int n FROM users WHERE email='hash-fail@example.test'`))[0].n,0);
  await db.query(`CREATE FUNCTION reject_session() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'session failed'; END $$`);
  await db.query('CREATE TRIGGER reject_session BEFORE INSERT ON refresh_sessions FOR EACH ROW EXECUTE FUNCTION reject_session()');
  await assert.rejects(service.register('session-fail@example.test',password),{status:503});
  assert.equal((await db.query(`SELECT count(*)::int n FROM users WHERE email='session-fail@example.test'`))[0].n,0);
  await db.query('DROP TRIGGER reject_session ON refresh_sessions');
  await db.query(`CREATE FUNCTION reject_identity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'identity failed'; END $$`);
  await db.query('CREATE TRIGGER reject_identity BEFORE INSERT ON auth_identities FOR EACH ROW EXECUTE FUNCTION reject_identity()');
  await assert.rejects(service.register('identity-fail@example.test',password),{status:503});
  assert.equal((await db.query(`SELECT count(*)::int n FROM users WHERE email='identity-fail@example.test'`))[0].n,0);
  await db.query('DROP TRIGGER reject_identity ON auth_identities');
  const google=await service.findOrCreateGoogleUser({id:'google-test-id',email:'google@example.test',name:'Google test'});
  assert.equal(google.user.emailVerified,true);
  await assert.rejects(service.register('google@example.test',password),{status:409});
  await assert.rejects(service.findOrCreateGoogleUser({id:'other-google-id',email:'a@example.test'}),{status:409});
  const hashBefore=argon2.hash;let dummyHashes=0;
  try{
    argon2.hash=async(input,...rest)=>{if(Buffer.isBuffer(input))dummyHashes++;return hashBefore(input,...rest);};
    for(const email of ['unknown1@example.test','unknown2@example.test','google@example.test'])await assert.rejects(service.login(email,password,'127.0.0.1'),{status:401});
    assert.equal(dummyHashes,1);
  }finally{argon2.hash=hashBefore;}
}
test('TypeORM + embedded PostgreSQL: atomic registration, race, rollback and Argon2 salt', async()=>{
  const f=await embeddedDatabase();try{await registrationChecks(f);}finally{await f.close();}
});
test('development synchronize preserves canonical index and existing users',async()=>{
  const f=await embeddedDatabase();
  try {
    await f.db.query(`INSERT INTO users(email,"displayName") VALUES (' Keep@Example.test ','keep')`);
    await f.db.synchronize();
    assert.equal((await f.db.query('SELECT count(*)::int n FROM users'))[0].n,1);
    assert.ok((await f.db.query(`SELECT indexname FROM pg_indexes WHERE indexname='UQ_users_email_normalized'`)).length);
    await assert.rejects(f.db.query(`INSERT INTO users(email,"displayName") VALUES ('keep@example.test','duplicate')`),{code:'23505'});
  }finally{await f.close();}
});
test('real isolated PostgreSQL: registration constraints and transaction', {skip:!process.env.TEST_DATABASE_URL}, async()=>{
  const f=await isolatedDatabase();try{await migrate(f.db);await registrationChecks(f);}finally{await f.close();}
});
test('real PostgreSQL: quota shared by two independent worker processes', {skip:!process.env.TEST_DATABASE_URL},async()=>{
  const {fork}=require('node:child_process');const {join}=require('node:path');
  const f=await isolatedDatabase();const children=[];
  try{
    await migrate(f.db);
    const run=()=>new Promise((resolve,reject)=>{
      const child=fork(join(__dirname,'helpers/login-limit-worker.cjs'),[],{stdio:['ignore','ignore','ignore','ipc']});children.push(child);
      const timer=setTimeout(()=>reject(Error('Quota worker timed out')),30000);
      child.once('message',message=>{clearTimeout(timer);message.error?reject(Error(message.error)):resolve(message);});
      child.once('error',error=>{clearTimeout(timer);reject(error);});
      child.send({url:process.env.TEST_DATABASE_URL,schema:f.schema});
    });
    const results=await Promise.all([run(),run()]);
    assert.equal(results.reduce((sum,r)=>sum+r.allowed,0),5);
    assert.equal(results.reduce((sum,r)=>sum+r.rejected,0),15);
  }finally{for(const child of children)child.kill();await f.close();}
});
