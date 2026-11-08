const {DataSource}=require('typeorm');
const {LoginLimitService}=require('../../dist/auth/login-limit.service');
process.once('message',async({url,schema})=>{
  const db=new DataSource({type:'postgres',url,extra:{options:`-c search_path=${schema},public`}});
  try{
    await db.initialize();
    const limiter=new LoginLimitService(db,{get:key=>key==='AUTH_RATE_LIMIT_SECRET'?'worker-test-only-secret-value-123456789':undefined});
    const results=await Promise.allSettled(Array.from({length:10},()=>limiter.reserve('multi@example.test','127.0.0.1')));
    process.send({allowed:results.filter(r=>r.status==='fulfilled').length,rejected:results.filter(r=>r.status==='rejected'&&r.reason.status===429).length});
  }catch{process.send({error:'Worker test failed'});process.exitCode=1;}
  finally{if(db.isInitialized)await db.destroy();process.disconnect();}
});
