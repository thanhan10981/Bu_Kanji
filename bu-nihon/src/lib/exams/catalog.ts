import 'server-only';
import { createHash } from 'node:crypto';
import july2025 from '@/data/exams/exam-2025-07.json';
import december2025 from '@/data/exams/exam-2025-12.json';
import july2026 from '@/data/exams/exam-2026-07.json';
import verifiedInput from '@/data/exams/verified-answers.json';
import sourceInput from '@/data/exams/source-pages.json';
import { applySourcePages, sourceManifestSchema } from '@/lib/exams/source-pages';
import { applyVerifiedAnswers, verifiedAnswersSchema } from '@/lib/exams/verified-answers';
import { examDraftSchema } from '@/lib/exams/schema';
import { publicExam, summarize } from '@/lib/exams/model';

const verified = verifiedAnswersSchema.parse(verifiedInput);
const sources = sourceManifestSchema.parse(sourceInput);
const catalog = [july2026, december2025, july2025].map(input => {
  const draft = applySourcePages(applyVerifiedAnswers(examDraftSchema.parse(input), verified), sources);
  const revision = createHash('sha256').update(JSON.stringify({ draft, source: verified.sourceSha256, pages: sources.exams[draft.examId] })).digest('hex').slice(0, 16);
  return { draft, revision, public: publicExam(draft, revision) };
});
export function findExam(id: string) { return catalog.find(item => item.draft.examId === id); }
export function examSummaries() { return catalog.map(item => summarize(item.public)); }
