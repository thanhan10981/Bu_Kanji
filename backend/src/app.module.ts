import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { JwtCookieGuard } from './auth/auth.guard';
import { VocabularyModule } from './vocabulary/vocabulary.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({}),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const useSsl = config.get('DATABASE_SSL') === 'true';
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
          ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
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
