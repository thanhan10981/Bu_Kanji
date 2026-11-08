import { findExam } from '@/lib/exams/catalog';

export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const entry = findExam(examId);
  if (!entry) return Response.json({ message: 'Không tìm thấy đề thi.' }, { status: 404 });
  return Response.json(entry.public, { headers: { 'Cache-Control': 'no-store' } });
}
