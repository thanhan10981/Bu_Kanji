const {test}=require('node:test');
const assert=require('node:assert/strict');
const {embeddedDatabase}=require('./helpers/auth-harness.cjs');
const {LoginLimitService,canonicalIp}=require('../dist/auth/login-limit.service');
test('shared SQL limiter reserves atomically, expires, survives service recreation and fails closed',async()=>{
  const f=await embeddedDatabase();
  const values={AUTH_RATE_LIMIT_SECRET:'s'.repeat(48)}; const config={get:key=>values[key]};
  try {
    const limiter=new LoginLimitService(f.db,config);
    for(let i=0;i<5;i++)await limiter.reserve('same@example.test','127.0.0.1');
    await assert.rejects(limiter.reserve('same@example.test','127.0.0.2'),e=>e.status===429&&e.retryAfterSeconds>=1);
    assert.equal((await f.db.query('SELECT count(*)::int n FROM auth_login_limits'))[0].n,2);
    await assert.rejects(new LoginLimitService(f.db,config).reserve('same@example.test','127.0.0.1'),{status:429});
    for(let i=0;i<30;i++)await limiter.reserve(`user${i}@example.test`,'127.0.0.9');
    await assert.rejects(limiter.reserve('another@example.test','127.0.0.9'),{status:429});
    await f.db.query('UPDATE auth_login_limits SET "expiresAt"=now()-interval \'1 second\'');
    await limiter.reserve('same@example.test','127.0.0.1');
    const rows=await f.db.query('SELECT * FROM auth_login_limits WHERE \"expiresAt\">now()');assert.ok(rows.every(r=>r.attempts===1));
    assert.ok(rows.every(r=>!r.scopeKey.includes('@')&&!r.scopeKey.includes('127.')));
    const parallel=await Promise.allSettled(Array.from({length:10},()=>limiter.reserve('parallel@example.test','127.0.0.3')));
    assert.equal(parallel.filter(r=>r.status==='fulfilled').length,5);
    await f.db.query('UPDATE auth_login_limits SET "expiresAt"=now()-interval \'2 days\'');
    await limiter.cleanup(); assert.equal((await f.db.query('SELECT count(*)::int n FROM auth_login_limits'))[0].n,0);
    await f.db.query('DROP TABLE auth_login_limits');
    await assert.rejects(limiter.reserve('x@example.test','127.0.0.1'),{status:503});
  }finally{await f.close();}
});
test('proxy settings reject global trust and untrusted forwarded headers cannot select client IP',async()=>{
  const {trustedProxies}=require('../dist/auth/proxy-trust');
  const express=require('express');
  assert.equal(trustedProxies(),false);
  for(const value of ['true','0.0.0.0/0','::/0','127.0.0.1/33'])assert.throws(()=>trustedProxies(value));
  const app=express();app.set('trust proxy',trustedProxies());app.get('/',(req,res)=>res.json({ip:canonicalIp(req.ip)}));
  const server=app.listen(0,'127.0.0.1');
  try {await new Promise(resolve=>server.once('listening',resolve));
    const response=await fetch(`http://127.0.0.1:${server.address().port}`,{headers:{'X-Forwarded-For':'1.2.3.4'}});
    assert.equal((await response.json()).ip,'127.0.0.1');
  }finally{await new Promise(resolve=>server.close(resolve));}
});
test('IP normalization merges IPv4-mapped aliases and config cannot disable the limiter',()=>{
  assert.equal(canonicalIp('::ffff:127.0.0.1'),'127.0.0.1');assert.equal(canonicalIp('::ffff:7f00:1'),'127.0.0.1');
  assert.equal(canonicalIp('0:0:0:0:0:0:0:1'),'::1');
  for(const value of ['0','-1','bad','1.2']) assert.throws(()=>new LoginLimitService({}, {get:key=>key==='AUTH_RATE_LIMIT_SECRET'?'s'.repeat(48):key==='AUTH_LOGIN_EMAIL_LIMIT'?value:undefined}));
});
