import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { mkdtemp, open, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { CreateImportDto, IMPORT_PART_BYTES, ImportResultDto } from './import.dto';

interface Job { id: string; name: string; size: number; model: string; status: string; lastModified: string; error: string | null; pagesRead: number; totalPages: number; expiresAt: string }
@Injectable()
export class ImportService implements OnModuleInit, OnModuleDestroy {
  private timer?: ReturnType<typeof setInterval>;
  private workers = new Set<Worker>();
  constructor(private readonly db: DataSource) {}
  onModuleInit() {
    void this.cleanup().catch(() => {});
    this.timer = setInterval(() => { void this.cleanup().catch(() => {}); }, 30 * 60 * 1000);
    this.timer.unref();
  }
  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await Promise.all([...this.workers].map(worker => worker.terminate()));
  }
  private async cleanup() {
    await this.db.query("UPDATE ai_import_jobs SET status='failed',error='Tiến trình đọc file bị gián đoạn. Hãy tiếp tục để đọc lại.' WHERE status='extracting' AND \"updatedAt\"<now()-interval '5 minutes'");
    await this.db.query('DELETE FROM ai_import_jobs WHERE "expiresAt" < now()');
    // Remove files left behind by a killed process; active worker files are newer.
    for (const entry of await readdir(tmpdir(), { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('bu-nihon-import-')) continue;
      const directory = join(tmpdir(), entry.name);
      const info = await stat(directory).catch(() => null);
      if (info && Date.now() - info.mtimeMs > 24 * 60 * 60 * 1000) await rm(directory, { recursive: true, force: true });
    }
  }
  private async job(owner: string, id: string, manager: Pick<EntityManager, 'query'> = this.db): Promise<Job> {
    const [job] = await manager.query('SELECT * FROM ai_import_jobs WHERE id=$1 AND "ownerId"=$2 AND "expiresAt">now()', [id, owner]);
    if (!job) throw new NotFoundException('Lần nhập không tồn tại hoặc đã hết hạn sau 24 giờ.');
    return job;
  }
  private locked<T>(owner: string, id: string, action: (m: EntityManager, job: Job) => Promise<T>) {
    return this.db.transaction(async m => {
      await m.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`ai-import:${id}`]);
      return action(m, await this.job(owner, id, m));
    });
  }
  async create(owner: string, input: CreateImportDto) {
    if (!/\.(pdf|docx|txt|csv|tsv|md|json)$/i.test(input.name)) throw new BadRequestException('Hỗ trợ PDF, DOCX, TXT, CSV, TSV, MD và JSON.');
    await this.cleanup();
    return this.db.transaction(async m => {
      await m.query('SELECT pg_advisory_xact_lock(81234003)');
      const [{ count }] = await m.query('SELECT count(*)::int AS count FROM ai_import_jobs WHERE "ownerId"=$1', [owner]);
      if (count >= 2) throw new ConflictException('Bạn đang có 2 lần nhập được giữ lại. Xóa lần nhập cũ hoặc chờ hết hạn 24 giờ.');
      const [{ bytes }] = await m.query("SELECT coalesce(sum(size),0)::bigint AS bytes FROM ai_import_jobs WHERE status IN ('uploading','extracting','failed')");
      if (Number(bytes) + input.size > 512 * 1024 * 1024) throw new HttpException('Bộ nhớ nhập file tạm đang đầy. Vui lòng thử lại sau.', 429);
      const [row] = await m.query('INSERT INTO ai_import_jobs("ownerId",name,size,model,"lastModified") VALUES($1,$2,$3,$4,$5) RETURNING id', [owner, input.name, input.size, input.model, input.lastModified]);
      return { id: row.id };
    });
  }
  async status(owner: string, id: string) {
    await this.db.query("UPDATE ai_import_jobs SET status='failed',error='Tiến trình đọc file bị gián đoạn. Chọn tiếp tục để đọc lại.',\"updatedAt\"=now() WHERE id=$1 AND \"ownerId\"=$2 AND status='extracting' AND \"updatedAt\" < now()-interval '5 minutes'", [id, owner]);
    const job = await this.job(owner, id);
    const parts = await this.db.query('SELECT index FROM ai_import_parts WHERE "jobId"=$1 ORDER BY index', [id]);
    const [{ total, completed }] = await this.db.query('SELECT count(*)::int AS total,count(cards)::int AS completed FROM ai_import_batches WHERE "jobId"=$1', [id]);
    return { ...job, lastModified: Number(job.lastModified), parts: parts.map((p: { index: number }) => p.index), partBytes: IMPORT_PART_BYTES, total, completed };
  }
  async part(owner: string, id: string, index: number, data: Buffer) {
    return this.locked(owner, id, async (m, job) => {
      if (job.status !== 'uploading') throw new ConflictException('File này đã bắt đầu xử lý.');
      const count = Math.ceil(job.size / IMPORT_PART_BYTES);
      const expected = index === count - 1 ? job.size - index * IMPORT_PART_BYTES : IMPORT_PART_BYTES;
      if (!Number.isInteger(index) || index < 0 || index >= count || !Buffer.isBuffer(data) || data.length !== expected) throw new BadRequestException('Kích thước hoặc thứ tự phần tải lên không hợp lệ.');
      const [existing] = await m.query('SELECT data=$3::bytea AS same FROM ai_import_parts WHERE "jobId"=$1 AND index=$2', [id, index, data]);
      if (existing && !existing.same) throw new ConflictException('Phần file không khớp bản đã tải. Hãy chọn lại đúng file gốc.');
      await m.query('INSERT INTO ai_import_parts("jobId",index,data) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [id, index, data]);
      return { uploaded: true };
    });
  }
  async prepare(owner: string, id: string) {
    const start = await this.locked(owner, id, async (m, job) => {
      await m.query('SELECT pg_advisory_xact_lock(81234003)');
      if (['ready', 'completed', 'extracting'].includes(job.status)) return false;
      const [{ bytes }] = await m.query('SELECT coalesce(sum(octet_length(data)),0)::bigint AS bytes FROM ai_import_parts WHERE "jobId"=$1', [id]);
      if (Number(bytes) !== job.size) throw new BadRequestException('File chưa tải đủ. Hãy tiếp tục tải các phần còn thiếu.');
      const [{ count }] = await m.query("SELECT count(*)::int AS count FROM ai_import_jobs WHERE status='extracting'");
      if (count >= 1) throw new HttpException('Hệ thống đang đọc tài liệu khác. Thử lại sau.', 429);
      await m.query("UPDATE ai_import_jobs SET status='extracting',error=NULL,\"updatedAt\"=now() WHERE id=$1", [id]);
      return true;
    });
    if (start) void this.extract(owner, id).catch(async () => {
      await this.db.query("UPDATE ai_import_jobs SET status='failed',error='Không thể đọc file. Hãy thử lại.',\"updatedAt\"=now() WHERE id=$1 AND status='extracting'", [id]).catch(() => {});
    });
    return { started: true };
  }
  private async extract(owner: string, id: string) {
    const job = await this.job(owner, id);
    const directory = await mkdtemp(join(tmpdir(), 'bu-nihon-import-'));
    const file = join(directory, 'document');
    try {
      const handle = await open(file, 'w');
      try {
        for (let index = 0; index < Math.ceil(job.size / IMPORT_PART_BYTES); index++) {
          const [part] = await this.db.query('SELECT data FROM ai_import_parts WHERE "jobId"=$1 AND index=$2', [id, index]);
          if (!part) throw new Error('missing part');
          await handle.writeFile(part.data);
        }
      } finally { await handle.close(); }
      const batches = await new Promise<string[]>((resolve, reject) => {
        const worker = new Worker(join(__dirname, '../../scripts/import-worker.cjs'), { workerData: { file, extension: job.name.split('.').at(-1)!.toLowerCase() }, resourceLimits: { maxOldGenerationSizeMb: 256 } });
        this.workers.add(worker);
        let finished = false;
        const timer = setTimeout(() => { void worker.terminate(); reject(new Error('timeout')); }, 4 * 60 * 1000);
        worker.on('message', (result: { batches?: string[]; error?: string; progress?: { pagesRead: number; totalPages: number } }) => {
          if (result.progress) void this.db.query('UPDATE ai_import_jobs SET "pagesRead"=$2,"totalPages"=$3,"updatedAt"=now() WHERE id=$1 AND status=\'extracting\'', [id, result.progress.pagesRead, result.progress.totalPages]).catch(() => {});
          if (result.batches) { finished = true; resolve(result.batches); }
          if (result.error) { finished = true; reject(new BadRequestException(result.error)); }
        });
        worker.on('error', () => reject(new Error('worker failed')));
        worker.on('exit', code => { clearTimeout(timer); this.workers.delete(worker); if (code !== 0 || !finished) reject(new Error('worker stopped')); });
      });
      await this.locked(owner, id, async m => {
        for (let index = 0; index < batches.length; index++) {
          await m.query('INSERT INTO ai_import_batches("jobId",index,text) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [id, index, batches[index]]);
        }
        await m.query("UPDATE ai_import_jobs SET status='ready',error=NULL,\"updatedAt\"=now() WHERE id=$1", [id]);
        await m.query('DELETE FROM ai_import_parts WHERE "jobId"=$1', [id]);
      });
    } catch (error) {
      const message = error instanceof BadRequestException ? error.message : 'Không đọc được file trong tài nguyên hiện tại. Hãy thử lại hoặc chia nhỏ tài liệu.';
      await this.db.query("UPDATE ai_import_jobs SET status='failed',error=$2,\"updatedAt\"=now() WHERE id=$1", [id, message]);
    } finally { await rm(directory, { recursive: true, force: true }); }
  }
  async batch(owner: string, id: string, index: number) {
    const job = await this.job(owner, id);
    const [batch] = await this.db.query('SELECT index,text,cards FROM ai_import_batches WHERE "jobId"=$1 AND index=$2', [id, index]);
    if (!batch) throw new NotFoundException('Chưa có phần tài liệu này.');
    return { ...batch, model: job.model };
  }
  async result(owner: string, id: string, index: number, body: ImportResultDto) {
    return this.locked(owner, id, async (m, job) => {
      if (!['ready', 'completed'].includes(job.status)) throw new ConflictException('Tài liệu chưa sẵn sàng.');
      const rows = await m.query('UPDATE ai_import_batches SET cards=$3::jsonb WHERE "jobId"=$1 AND index=$2 AND cards IS NULL RETURNING index', [id, index, JSON.stringify(body.cards)]);
      if (!rows.length) {
        const [existing] = await m.query('SELECT index FROM ai_import_batches WHERE "jobId"=$1 AND index=$2', [id, index]);
        if (!existing) throw new NotFoundException('Phần tài liệu không tồn tại.');
      }
      await m.query("UPDATE ai_import_jobs SET status=CASE WHEN NOT EXISTS(SELECT 1 FROM ai_import_batches WHERE \"jobId\"=$1 AND cards IS NULL) THEN 'completed' ELSE 'ready' END,\"updatedAt\"=now() WHERE id=$1", [id]);
      const [stored] = await m.query('SELECT cards FROM ai_import_batches WHERE "jobId"=$1 AND index=$2', [id, index]);
      return { saved: true, cards: stored.cards };
    });
  }
  async remove(owner: string, id: string) {
    return this.locked(owner, id, async (m, job) => {
      if (job.status === 'extracting') throw new ConflictException('Chờ đọc file xong trước khi xóa lần nhập.');
      await m.query('DELETE FROM ai_import_jobs WHERE id=$1', [id]);
      return { deleted: true };
    });
  }
}
