/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test harness. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const ts = require('typescript');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
function client(fetch) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(join(__dirname, '../src/lib/api.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(js, { exports, process: { env: {} }, fetch, Response, URLSearchParams, window: {dispatchEvent() {throw Error('auth-expired should not fire');}}, Event });
  return exports;
}
function authModule(apiModule) {
  const load=(path,imports)=>{
    const exports={};
    const js=ts.transpileModule(readFileSync(join(__dirname,path),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    vm.runInNewContext(js,{exports,require:name=>imports[name]??require(name)});return exports;
  };
  const schemas=load('../src/lib/auth/schemas.ts',{});
  return load('../src/lib/auth/service.ts',{'@/lib/api':apiModule,'@/lib/auth/schemas':schemas});
}
test('register/login failures are never replayed or refreshed', async () => {
  const calls=[]; const {api} = client(async path => { calls.push(path); return Response.json({message:'Denied'}, {status:401}); });
  for (const path of ['/auth/register','/auth/login']) await assert.rejects(api.post(path, {}), {status:401});
  assert.deepEqual(calls, ['/api/auth/register','/api/auth/login']);
});
test('Retry-After and error arrays are read without retrying', async () => {
  for (const retry of ['30','bad','-1','','9007199254740991']) {
    let calls=0; const {api}=client(async()=>{calls++;return Response.json({message:['Chờ rồi thử lại.']},{status:429,headers:{'Retry-After':retry}});});
    await assert.rejects(api.post('/auth/login',{}), e => e.status === 429 && e.message === 'Chờ rồi thử lại.' && e.retryAfterSeconds === (retry === '30' ? 30 : undefined));
    assert.equal(calls,1);
  }
});
test('protected reads refresh once and network errors do not replay register', async () => {
  const calls=[];const {api}=client(async path=>{calls.push(path);return path.endsWith('/refresh')?Response.json({}):calls.length===1?Response.json({},{status:401}):Response.json({value:1});});
  assert.equal((await api.get('/protected')).value,1);assert.equal(calls.length,3);
  let count=0;const broken=client(async()=>{count++;throw Error('offline');});
  await assert.rejects(broken.api.post('/auth/register',{}));assert.equal(count,1);
});
test('invalid inputs make no request; lost registration response probes /me without replay',async()=>{
  const calls=[];const apiModule=client(async path=>{calls.push(path);if(path.endsWith('/register'))throw Error('offline');return Response.json({},{status:401});});
  const {authenticate}=authModule(apiModule);
  await assert.rejects(authenticate('signup',{email:'bad',password:'short'}));assert.equal(calls.length,0);
  await assert.rejects(authenticate('signup',{email:'a@example.test',password:'password'}),e=>e.status===0&&e.message.includes('đăng nhập'));
  assert.equal(calls.filter(path=>path.endsWith('/register')).length,1);
});
test('unknown response cannot claim success; 409/503 are retained for UI',async()=>{
  for(const status of [200,400,409,503]){
    const {authenticate}=authModule(client(async()=>Response.json(status===200?{}:{message:'Lỗi'}, {status})));
    await assert.rejects(authenticate('signup',{email:'a@example.test',password:'password'}),e=>e.status===(status===200?502:status));
  }
});
