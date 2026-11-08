import { notFound } from 'next/navigation';
import { ExamWorkspace } from '@/components/exams/ExamWorkspace';
import { examSummaries, findExam } from '@/lib/exams/catalog';

export function generateStaticParams() { return examSummaries().map(exam => ({ examId: exam.examId })); }
export default async function Page({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  if (!findExam(examId)) notFound();
  return <ExamWorkspace examId={examId} />;
}
