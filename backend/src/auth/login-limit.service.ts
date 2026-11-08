import { HttpException, Injectable, Logger, OnModuleDestroy, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { createHmac } from 'crypto';
import { isIP } from 'net';

export function canonicalIp(input: string) {
  if (!isIP(input)) throw new ServiceUnavailableException('Không xác định được nguồn đăng nhập.');
  if (isIP(input) === 4) return input;
  const canonical = new URL(`http://[${input}]/`).hostname.slice(1, -1);
  const mapped = /^::ffff:([a-f\d]+):([a-f\d]+)$/i.exec(canonical);
  if (mapped) {
    const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
    return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
  }
  return canonical;
}

export class LoginQuotaException extends HttpException {
  constructor(public readonly retryAfterSeconds: number) {
    super('Bạn đã thử đăng nhập quá nhiều lần. Vui lòng chờ rồi thử lại.', 429);
  }
}

@Injectable()
export class LoginLimitService implements OnModuleInit, OnModuleDestroy {
  private readonly secret: string;
  private readonly emailLimit: number;
  private readonly ipLimit: number;
  private readonly windowSeconds: number;
  private timer?: ReturnType<typeof setInterval>;
  private cleaning = false;
  private readonly logger = new Logger(LoginLimitService.name);

  constructor(private readonly db: DataSource, config: ConfigService) {
    const secret = config.get<string>('AUTH_RATE_LIMIT_SECRET');
    if (!secret || secret.length < 32 || /replace_|YOUR-|change_me/i.test(secret)
      || [config.get<string>('JWT_ACCESS_SECRET'), config.get<string>('JWT_REFRESH_SECRET')].includes(secret)) {
      throw new Error('AUTH_RATE_LIMIT_SECRET must be a non-example secret of at least 32 characters');
    }
    this.secret = secret;
    const number = (key: string, fallback: number, maximum: number) => {
      const raw = config.get<string>(key);
      const value = raw === undefined ? fallback : Number(raw);
      if (!Number.isSafeInteger(value) || value < 1 || value > maximum) throw new Error(`Invalid ${key}`);
      return value;
    };
    this.emailLimit = number('AUTH_LOGIN_EMAIL_LIMIT', 5, 1000);
    this.ipLimit = number('AUTH_LOGIN_IP_LIMIT', 30, 10000);
    this.windowSeconds = number('AUTH_LOGIN_WINDOW_SECONDS', 900, 86400);
  }

  onModuleInit() {
    // Cleanup also runs without login traffic. Do not log exception data or scope keys.
    const clean = () => { void this.cleanup().catch(() => this.logger.warn('Login quota cleanup unavailable')); };
    clean(); this.timer = setInterval(clean, 60 * 60 * 1000); this.timer.unref();
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  async cleanup() {
    if (this.cleaning) return;
    this.cleaning = true;
    try {
      // Bounded batches; no request is held open while draining expired rows.
      for (let batch = 0; batch < 100; batch++) {
        const rows = await this.db.query(`DELETE FROM auth_login_limits WHERE "scopeKey" IN
          (SELECT "scopeKey" FROM auth_login_limits WHERE "expiresAt" < CURRENT_TIMESTAMP
           ORDER BY "expiresAt" LIMIT 1000) AND "expiresAt" < CURRENT_TIMESTAMP RETURNING "scopeKey"`);
        const deleted = typeof rows[1] === 'number' ? rows[1] : rows.length;
        if (deleted < 1000) break;
      }
    } finally { this.cleaning = false; }
  }

  async reserve(email: string, ip: string) {
    const key = (scope: string, value: string) => `${scope}:${createHmac('sha256', this.secret).update(value).digest('hex')}`;
    const scopes = [
      { key: key('email', email.trim().toLowerCase()), limit: this.emailLimit },
      { key: key('ip', canonicalIp(ip)), limit: this.ipLimit },
    ].sort((a, b) => a.key.localeCompare(b.key));
    let retry: number;
    try {
      retry = await this.db.transaction(async manager => {
        for (const scope of scopes) await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 410081))', [scope.key]);
        const [{ now }] = await manager.query('SELECT clock_timestamp() AS now');
        const current = new Date(now).getTime();
        const rows: { scopeKey: string; attempts: number; expiresAt: Date }[] = await manager.query(
          'SELECT * FROM auth_login_limits WHERE "scopeKey" = ANY($1::text[])', [scopes.map(scope => scope.key)]);
        const blocked = scopes.map(scope => rows.find(row => row.scopeKey === scope.key && row.attempts >= scope.limit
          && new Date(row.expiresAt).getTime() > current)).filter(row => row !== undefined);
        if (blocked.length) return Math.max(1, ...blocked.map(row => Math.ceil((new Date(row.expiresAt).getTime() - current) / 1000)));
        for (const scope of scopes) {
          await manager.query(`INSERT INTO auth_login_limits ("scopeKey",attempts,"windowStartedAt","expiresAt") VALUES ($1,1,$2,$3)
            ON CONFLICT ("scopeKey") DO UPDATE SET
              attempts=CASE WHEN auth_login_limits."expiresAt" <= $2 THEN 1 ELSE auth_login_limits.attempts+1 END,
              "windowStartedAt"=CASE WHEN auth_login_limits."expiresAt" <= $2 THEN $2 ELSE auth_login_limits."windowStartedAt" END,
              "expiresAt"=CASE WHEN auth_login_limits."expiresAt" <= $2 THEN $3 ELSE auth_login_limits."expiresAt" END`,
          [scope.key, new Date(current), new Date(current + this.windowSeconds * 1000)]);
        }
        return 0;
      });
    } catch { throw new ServiceUnavailableException('Dịch vụ đăng nhập tạm thời chưa sẵn sàng. Vui lòng thử lại sau.'); }
    if (retry > 0) throw new LoginQuotaException(retry);
  }
}
