import type { Metadata } from 'next';
import { ExamLibrary } from '@/components/exams/ExamLibrary';
import { examSummaries } from '@/lib/exams/catalog';

export const metadata: Metadata = { title: 'Luyện đề JLPT N3 | Bú Kanji', description: 'Luyện đề N3, lưu bài đang làm và xem lại đáp án sau khi nộp.' };
export default function Page() { return <ExamLibrary exams={examSummaries()} />; }
