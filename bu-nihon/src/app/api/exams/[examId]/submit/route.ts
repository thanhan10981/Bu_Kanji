import { findExam } from '@/lib/exams/catalog';
import { gradeExam } from '@/lib/exams/model';
import { submissionSchema } from '@/lib/exams/schema';

export const runtime = 'nodejs';
export async function POST(request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const entry = findExam(examId);
  if (!entry) return Response.json({ message: 'Không tìm thấy đề thi.' }, { status: 404 });
  if (Number(request.headers.get('content-length')) > 20000) return Response.json({ message: 'Bài làm quá lớn.' }, { status: 413 });
  // Read a bounded stream; Content-Length alone is not a trustworthy size limit.
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ message: 'Bài làm trống.' }, { status: 400 });
  let raw = ''; const decoder = new TextDecoder(); let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 20000) { await reader.cancel(); return Response.json({ message: 'Bài làm quá lớn.' }, { status: 413 }); }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const parsed = submissionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ message: 'Bài làm không hợp lệ.' }, { status: 400 });
    if (parsed.data.revision !== entry.revision) return Response.json({ message: 'Đề vừa được cập nhật. Hãy mở lượt làm mới.' }, { status: 409 });
    const report = gradeExam(entry.draft, entry.revision, parsed.data.sectionIds, parsed.data.answers);
    return Response.json(report, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return Response.json({ message: 'Không thể chấm bài. Hãy kiểm tra phần và đáp án đã chọn.' }, { status: 400 });
  }
}
