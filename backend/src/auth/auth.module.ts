import { LoginLimitService } from './login-limit.service';
import { LoginLimit } from './entities/login-limit.entity';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { User } from './entities/user.entity';
import { AuthIdentity } from './entities/auth-identity.entity';
import { RefreshSession } from './entities/refresh-session.entity';
import { EmailVerificationCode } from './entities/email-verification-code.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuthIdentity, RefreshSession, EmailVerificationCode, PasswordResetToken, LoginLimit]), JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, MailService, LoginLimitService],
  exports: [AuthService],
})
export class AuthModule {}
