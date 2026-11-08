import { LoginLimitService } from './login-limit.service';
import { ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, randomInt, randomUUID } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthenticatedUser, RefreshTokenPayload } from './auth.types';
import { User } from './entities/user.entity';
import { AuthIdentity } from './entities/auth-identity.entity';
import { RefreshSession } from './entities/refresh-session.entity';
import { EmailVerificationCode } from './entities/email-verification-code.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { MailService } from './mail.service';
import { authCapabilities } from './capabilities';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

@Injectable()
export class AuthService {
  private dummyHash?: Promise<string>;
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuthIdentity) private readonly identities: Repository<AuthIdentity>,
    @InjectRepository(RefreshSession) private readonly refreshSessions: Repository<RefreshSession>,
    @InjectRepository(EmailVerificationCode) private readonly verificationCodes: Repository<EmailVerificationCode>,
    @InjectRepository(PasswordResetToken) private readonly resetTokens: Repository<PasswordResetToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly loginLimits: LoginLimitService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private asUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      emailVerified: user.emailVerified,
    };
  }

  async getAuthenticatedUser(id: string): Promise<AuthenticatedUser> {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new UnauthorizedException('Không tìm thấy người dùng.');
    return this.asUser(user);
  }

  async register(email: string, password: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const existing = await this.users.createQueryBuilder('user')
      .where('lower(btrim(user.email)) = :email', { email: normalizedEmail }).getOne();
    if (existing) throw new ConflictException('Email này đã được đăng ký.');
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 });
    try {
      return await this.users.manager.transaction(async manager => {
        const users = manager.getRepository(User);
        const identities = manager.getRepository(AuthIdentity);
        const user = await users.save(users.create({
          email: normalizedEmail, passwordHash, displayName: normalizedEmail.split('@')[0],
          avatarUrl: null, emailVerified: false,
        }));
        await identities.save(identities.create({ userId: user.id, provider: 'password', providerAccountId: normalizedEmail }));
        return this.createSession(user, manager);
      });
    } catch (error) {
      const failure = error as { code?: string; constraint?: string };
      // Only unique constraints concerning email/password identity mean a duplicate account.
      if (failure.code === '23505' && (failure.constraint === 'UQ_users_email_normalized'
        || failure.constraint === 'users_email_key'
        || this.users.metadata?.uniques.some(unique => unique.name === failure.constraint && unique.columns.length === 1 && unique.columns[0].propertyName === 'email') || failure.constraint === 'UQ_auth_identities_provider_account')) {
        throw new ConflictException('Email này đã được đăng ký.');
      }
      // Do not pass database query/parameters or token signing details to the HTTP logger.
      throw new ServiceUnavailableException('Không thể tạo tài khoản. Vui lòng thử lại sau.');
    }
  }

  async resendVerification(email: string) {
    this.requireEmailService();
    const user = await this.users.findOneBy({ email: this.normalizeEmail(email) });
    if (user && !user.emailVerified) await this.createAndSendVerificationCode(user);
    return { message: 'Nếu email hợp lệ, mã xác thực đã được gửi.' };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.users.findOneBy({ email: this.normalizeEmail(email) });
    if (!user) throw new UnauthorizedException('Mã xác thực không hợp lệ.');
    if (user.emailVerified) return { message: 'Email đã được xác thực.' };

    const codes = await this.verificationCodes
      .createQueryBuilder('code')
      .addSelect('code.codeHash')
      .where('code.userId = :userId', { userId: user.id })
      .andWhere('code.usedAt IS NULL')
      .andWhere('code.expiresAt > NOW()')
      .orderBy('code.createdAt', 'DESC')
      .getMany();
    const validCode = await this.findMatchingSecret(codes, code, (item) => item.codeHash);
    if (!validCode) throw new UnauthorizedException('Mã xác thực không hợp lệ hoặc đã hết hạn.');

    validCode.usedAt = new Date();
    user.emailVerified = true;
    await this.verificationCodes.save(validCode);
    await this.users.save(user);
    return { message: 'Xác thực email thành công.' };
  }

  async login(email: string, password: string, ip: string) {
    await this.loginLimits.reserve(this.normalizeEmail(email), ip);
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('lower(btrim(user.email)) = :email', { email: this.normalizeEmail(email) })
      .getOne();
    const hash = user?.passwordHash ?? await (this.dummyHash ??= argon2.hash(randomBytes(32), { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 }));
    const valid = await argon2.verify(hash, password);
    if (!user?.passwordHash || !valid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }
    return this.createSession(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type !== 'refresh') throw new UnauthorizedException();
      const session = await this.refreshSessions
        .createQueryBuilder('session')
        .addSelect('session.tokenHash')
        .leftJoinAndSelect('session.user', 'user')
        .where('session.id = :id', { id: payload.sid })
        .andWhere('session.userId = :userId', { userId: payload.sub })
        .andWhere('session.revokedAt IS NULL')
        .andWhere('session.expiresAt > NOW()')
        .getOne();
      if (!session || !(await argon2.verify(session.tokenHash, refreshToken))) throw new UnauthorizedException();
      session.revokedAt = new Date();
      await this.refreshSessions.save(session);
      return this.createSession(session.user);
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn.');
    }
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    try {
      const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      await this.refreshSessions.update({ id: payload.sid, userId: payload.sub }, { revokedAt: new Date() });
    } catch {
      // Cookies are cleared even for an expired or malformed token.
    }
  }

  async forgotPassword(email: string) {
    this.requireEmailService();
    const user = await this.users.findOneBy({ email: this.normalizeEmail(email) });
    if (user) {
      const token = randomBytes(32).toString('base64url');
      await this.resetTokens.save(this.resetTokens.create({
        userId: user.id,
        tokenHash: await argon2.hash(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        usedAt: null,
      }));
      const url = new URL('/reset-password', this.config.getOrThrow<string>('FRONTEND_URL'));
      url.searchParams.set('token', token);
      await this.mail.sendPasswordReset(user.email, url.toString());
    }
    return { message: 'Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi.' };
  }

  async resetPassword(token: string, password: string) {
    const records = await this.resetTokens
      .createQueryBuilder('token')
      .addSelect('token.tokenHash')
      .leftJoinAndSelect('token.user', 'user')
      .where('token.usedAt IS NULL')
      .andWhere('token.expiresAt > NOW()')
      .orderBy('token.createdAt', 'DESC')
      .getMany();
    const record = await this.findMatchingSecret(records, token, (item) => item.tokenHash);
    if (!record) throw new UnauthorizedException('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');

    record.user.passwordHash = await argon2.hash(password);
    record.usedAt = new Date();
    await this.users.save(record.user);
    await this.resetTokens.save(record);
    await this.refreshSessions.update({ userId: record.userId }, { revokedAt: new Date() });
    return { message: 'Đặt lại mật khẩu thành công.' };
  }

  async findOrCreateGoogleUser(profile: { id: string; email: string; name?: string; picture?: string }) {
    const email = this.normalizeEmail(profile.email);
    let identity = await this.identities.findOne({ where: { provider: 'google', providerAccountId: profile.id }, relations: { user: true } });
    if (identity) return this.createSession(identity.user);

    let user = await this.users.findOneBy({ email });
    if (!user) {
      user = await this.users.save(this.users.create({
        email,
        emailVerified: true,
        displayName: profile.name || email.split('@')[0],
        avatarUrl: profile.picture || null,
        passwordHash: null,
      }));
    } else {
      // An unverified password account must not be linked solely by matching email.
      if (!user.emailVerified) throw new ConflictException('Email này đã có tài khoản mật khẩu. Vui lòng đăng nhập bằng mật khẩu.');
      user.emailVerified = true;
      if (profile.name) user.displayName = profile.name;
      if (profile.picture) user.avatarUrl = profile.picture;
      user = await this.users.save(user);
    }
    identity = await this.identities.save(this.identities.create({ userId: user.id, provider: 'google', providerAccountId: profile.id }));
    return this.createSession(user);
  }

  private async createAndSendVerificationCode(user: User) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.verificationCodes.update({ userId: user.id }, { usedAt: new Date() });
    await this.verificationCodes.save(this.verificationCodes.create({
      userId: user.id,
      codeHash: await argon2.hash(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      usedAt: null,
    }));
    await this.mail.sendVerificationCode(user.email, code);
  }

  private async createSession(user: User, manager?: EntityManager) {
    const sessions = manager ? manager.getRepository(RefreshSession) : this.refreshSessions;
    const id = randomUUID();
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, type: 'access' }, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
    const refreshToken = await this.jwt.signAsync({ sub: user.id, sid: id, type: 'refresh' }, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    });
    await sessions.save(sessions.create({ id, userId: user.id,
      tokenHash: await argon2.hash(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000), revokedAt: null,
    }));
    return { user: this.asUser(user), accessToken, refreshToken };
  }

  private async findMatchingSecret<T>(items: T[], secret: string, getHash: (item: T) => string) {
    for (const item of items) if (await argon2.verify(getHash(item), secret)) return item;
    return null;
  }

  private requireEmailService() {
    if (!authCapabilities(key => this.config.get<string>(key)).passwordReset)
      throw new ServiceUnavailableException('Dịch vụ gửi email tạm thời chưa sẵn sàng. Vui lòng thử lại sau.');
  }
}
