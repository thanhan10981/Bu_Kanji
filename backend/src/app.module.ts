import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { JwtCookieGuard } from './auth/auth.guard';
import { VocabularyModule } from './vocabulary/vocabulary.module';
// Shared with the migration CLI so both connections use the same TLS policy.
const { databaseSsl }: { databaseSsl: (env: NodeJS.ProcessEnv) => { rejectUnauthorized: boolean } | undefined } = require('../scripts/database-ssl.cjs');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({}),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const ssl = databaseSsl({ DATABASE_SSL: config.get<string>('DATABASE_SSL'), DATABASE_SSL_REJECT_UNAUTHORIZED: config.get<string>('DATABASE_SSL_REJECT_UNAUTHORIZED') });
        return {
          type: 'postgres' as const,
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: config.getOrThrow<string>('POSTGRES_HOST'),
                port: Number(config.get('POSTGRES_PORT', 5432)),
                username: config.getOrThrow<string>('POSTGRES_USER'),
                password: config.getOrThrow<string>('POSTGRES_PASSWORD'),
                database: config.getOrThrow<string>('POSTGRES_DB'),
              }),
          ...(ssl ? { ssl } : {}),
          autoLoadEntities: true,
          synchronize: config.get('NODE_ENV') !== 'production',
        };
      },
    }),
    HealthModule,
    VocabularyModule,
    AuthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtCookieGuard }],
})
export class AppModule {}
