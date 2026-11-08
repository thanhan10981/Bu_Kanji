require('reflect-metadata');
const { NestFactory, Reflector } = require('@nestjs/core');
const { Module, ValidationPipe } = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const { ConfigService } = require('@nestjs/config');
const cookieParser = require('cookie-parser');
const { AuthController } = require('../../dist/auth/auth.controller');
const { AuthService } = require('../../dist/auth/auth.service');
const { JwtCookieGuard } = require('../../dist/auth/auth.guard');
const { embeddedDatabase, authService } = require('./auth-harness.cjs');

async function startAuthFixture(port=0) {
  const f=await embeddedDatabase();const {service,config}=authService(f.db);
  class TestModule {}
  Module({controllers:[AuthController],providers:[{provide:AuthService,useValue:service},{provide:ConfigService,useValue:config}]})(TestModule);
  const app=await NestFactory.create(TestModule,{logger:false});
  app.use(cookieParser());app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({whitelist:true,transform:true,forbidNonWhitelisted:true}));
  app.useGlobalGuards(new JwtCookieGuard(new Reflector(),new JwtService(),config,service));
  await app.listen(port,'127.0.0.1');
  return { app, db:f.db, async close(){await app.close();await f.close();} };
}
module.exports={startAuthFixture};
if(require.main===module)startAuthFixture(Number(process.env.AUTH_TEST_PORT)||4391).then(f=>{
  console.log('Local auth test fixture ready');
  process.on('SIGINT',()=>void f.close().then(()=>process.exit(0)));
});
