require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { JwtService } = require('@nestjs/jwt');
const { AuthService } = require('../dist/auth/auth.service');

// Real service + crypto; in-memory repositories/mail. This is not PostgreSQL/provider E2E.
function repository() {
  const rows = [];
  return {
    rows,
    create: data => ({ id: randomUUID(), ...data }),
    save: async row => { if (!rows.some(x => x.id === row.id)) rows.push(row); return row; },
    findOneBy: async conditions => rows.find(row => Object.entries(conditions).every(([key,value]) => row[key] === value)),
    findOne: async ({where}) => rows.find(row => Object.entries(where).every(([key,value]) => row[key] === value)),
    update: async (conditions, changes) => { for (const row of rows) if (Object.entries(conditions).every(([key,value]) => row[key] === value)) Object.assign(row, changes); },
    createQueryBuilder() {
      let params = {};
      const query = {
        addSelect() { return query; }, leftJoinAndSelect() { return query; },
        where(_sql, values) { Object.assign(params, values); return query; },
        andWhere(_sql, values) { Object.assign(params, values); return query; },
        orderBy() { return query; },
        getOne: async () => rows.find(row => (!params.email || row.email === params.email)
          && (!params.id || row.id === params.id) && (!params.userId || row.userId === params.userId)
          && !row.revokedAt && (!row.expiresAt || row.expiresAt > new Date())),
        getMany: async () => rows.filter(row => (!params.userId || row.userId === params.userId)
          && !row.usedAt && row.expiresAt > new Date()),
      };
      return query;
    },
  };
}

test('auth lifecycle: registration without email, password login, refresh rotation, logout, reset and one-time token', async () => {
  const users=repository(), identities=repository(), sessions=repository(), codes=repository(), resets=repository();
  const env={NODE_ENV:'production',RESEND_API_KEY:'re_unit_test_only',RESEND_FROM_EMAIL:'Auth <auth@verified.test>',
    JWT_ACCESS_SECRET:'a'.repeat(48),JWT_REFRESH_SECRET:'b'.repeat(48),FRONTEND_URL:'https://app.verified.test'};
  let deliveredCode='', deliveredReset='';
  const mail={sendVerificationCode:async (_email,code)=>{deliveredCode=code;},sendPasswordReset:async (_email,url)=>{deliveredReset=url;}};
  const service=new AuthService(users,identities,sessions,codes,resets,new JwtService(),
    {get:key=>env[key],getOrThrow:key=>env[key]},mail,{reserve:async()=>{}});
  const repos = { User:users, AuthIdentity:identities, RefreshSession:sessions };
  users.manager = { transaction: async action => {
    const snapshots=Object.values(repos).map(r=>[r,[...r.rows]]);
    try {return await action({getRepository:Type=>repos[Type.name]});}
    catch(error){for(const [repo,rows] of snapshots)repo.rows.splice(0,repo.rows.length,...rows);throw error;}
  } };
  const email='account@example.test';
  delete env.RESEND_API_KEY; delete env.RESEND_FROM_EMAIL;
  await service.register(' ACCOUNT@example.test ','OriginalTest!123');
  assert.equal(deliveredCode,'');
  assert.equal(codes.rows.length,0);
  await assert.rejects(()=>service.register(email,'Replacement!123'),{status:409});
  await assert.rejects(()=>service.login(email,'WrongPassword!123'),{status:401});
  await assert.rejects(()=>service.forgotPassword(email),{status:503});
  await assert.rejects(()=>service.findOrCreateGoogleUser({id:'google-user',email}),{status:409});
  const first=await service.login(email,'OriginalTest!123');
  assert.equal(first.user.emailVerified,false);
  assert.equal(first.user.passwordHash,undefined);
  sessions.rows.forEach(row=>{row.user=users.rows.find(user=>user.id===row.userId);});
  const second=await service.refresh(first.refreshToken);
  assert.notEqual(second.refreshToken,first.refreshToken);
  await assert.rejects(()=>service.refresh(first.refreshToken),{status:401});
  await service.logout(second.refreshToken);
  await assert.rejects(()=>service.refresh(second.refreshToken),{status:401});
  env.RESEND_API_KEY='re_unit_test_only'; env.RESEND_FROM_EMAIL='Auth <auth@verified.test>';
  await service.forgotPassword(email);
  const link=new URL(deliveredReset);
  assert.equal(link.origin,env.FRONTEND_URL);
  assert.equal(link.pathname,'/reset-password');
  const token=link.searchParams.get('token');
  resets.rows.forEach(row=>{row.user=users.rows.find(user=>user.id===row.userId);});
  await service.resetPassword(token,'ChangedTest!123');
  await assert.rejects(()=>service.resetPassword(token,'AnotherTest!123'),{status:401});
  await assert.rejects(()=>service.login(email,'OriginalTest!123'),{status:401});
  assert.equal((await service.login(email,'ChangedTest!123')).user.id,first.user.id);
});
