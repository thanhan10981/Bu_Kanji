import { HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class AiService {
  constructor(private readonly db: DataSource, private readonly config: ConfigService) {}

  private limit(name: string, fallback: number) {
    const raw = this.config.get<string>(name);
    const value = raw === undefined ? fallback : Number(raw);
    if (!Number.isSafeInteger(value) || value < 1 || value > 1000000) {
      throw new ServiceUnavailableException('Cấu hình hạn mức AI không hợp lệ.');
    }
    return value;
  }

  async authorize(userId: string) {
    const minute = this.limit('AI_REQUESTS_PER_MINUTE', 12);
    const daily = this.limit('AI_REQUESTS_PER_DAY', 100);
    const global = this.limit('AI_GLOBAL_REQUESTS_PER_DAY', 1000);
    return this.db.transaction(async manager => {
      // Shared by all Render processes and Vercel instances; never trust client IDs.
      await manager.query('SELECT pg_advisory_xact_lock(81234002)');
      const [{ now }] = await manager.query('SELECT CURRENT_TIMESTAMP AS now');
      const current = new Date(now).getTime();
      const minuteBucket = new Date(Math.floor(current / 60000) * 60000);
      const dayBucket = new Date(Math.floor(current / 86400000) * 86400000);
      const counters: [string, Date, number, string][] = [
        [`user-minute:${userId}`, minuteBucket, minute, 'Bạn đã đạt hạn mức AI trong phút này. Vui lòng chờ rồi thử lại.'],
        [`user-day:${userId}`, dayBucket, daily, 'Bạn đã dùng hết hạn mức AI hôm nay. Hạn mức được đặt lại lúc 07:00 giờ Việt Nam.'],
        ['global-day', dayBucket, global, 'Hệ thống đã đạt hạn mức AI hôm nay. Vui lòng thử lại sau.'],
      ];
      for (const [scope, bucket, limit, message] of counters) {
        const rows = await manager.query(`INSERT INTO ai_usage(scope,bucket,requests) VALUES($1,$2,1)
          ON CONFLICT(scope,bucket) DO UPDATE SET requests=ai_usage.requests+1
          WHERE ai_usage.requests < $3 RETURNING requests`, [scope, bucket, limit]);
        if (!rows.length) throw new HttpException(message, 429);
      }
      await manager.query("DELETE FROM ai_usage WHERE bucket < CURRENT_TIMESTAMP - interval '2 days'");
      return { allowed: true };
    });
  }
}
