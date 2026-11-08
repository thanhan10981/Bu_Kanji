import { publicExamSchema, reportSchema, type ExamReport } from '@/lib/exams/schema';
import type { PublicExam } from '@/lib/exams/model';

async function request(path: string, init?: RequestInit) {
  let response: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try { response = await fetch(path, { ...init, signal: controller.signal, cache: 'no-store', credentials: 'same-origin' }); }
  catch { throw new Error('Không thể kết nối. Bài làm vẫn được giữ trên thiết bị, hãy thử lại.'); }
  finally { clearTimeout(timer); }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof body?.message === 'string' ? body.message : 'Không thể tải đề. Vui lòng thử lại.');
  return body;
}
export async function loadExam(id: string): Promise<PublicExam> {
  const body = await request(`/api/exams/${encodeURIComponent(id)}`);
  const parsed = publicExamSchema.safeParse(body);
  if (!parsed.success) throw new Error('Nội dung đề không hợp lệ.');
  return parsed.data;
}
export async function submitExam(id: string, revision: string, sectionIds: string[], answers: Record<string, string[]>): Promise<ExamReport> {
  const body = await request(`/api/exams/${encodeURIComponent(id)}/submit`, { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision, sectionIds, answers }) });
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) throw new Error('Kết quả trả về không hợp lệ. Bài làm vẫn được giữ để thử lại.');
  return parsed.data;
}
