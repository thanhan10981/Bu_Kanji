import { z } from 'zod';
import { sourcePageSchema, type ExamDraft } from './schema.ts';

const documentSchema = z.object({ fileName: z.string().min(1), sha256: z.string().regex(/^[a-f0-9]{64}$/),
  pages: z.record(z.string(), sourcePageSchema.extend({ sha256: z.string().regex(/^[a-f0-9]{64}$/) })),
});
export const sourceManifestSchema = z.object({ formatVersion: z.literal(1), exams: z.record(z.string(), z.object({
  questions: documentSchema.extend({ pdfUrl: z.string() }), script: documentSchema,
  sections: z.record(z.string(), z.object({ pages: z.array(z.number().int().positive()).min(1),
    initialPageByQuestion: z.record(z.string(), z.number().int().positive()),
    scriptPages: z.array(z.number().int().positive()), choiceCount: z.union([z.literal(3), z.literal(4)]),
  })),
})) });
export type SourceManifest = z.infer<typeof sourceManifestSchema>;

export function applySourcePages(draft: ExamDraft, manifest: SourceManifest): ExamDraft {
  const source = manifest.exams[draft.examId];
  if (!source || Object.keys(source.sections).length !== draft.sections.length) throw new Error('Missing original exam sections');
  const resolved = new Set<string>();
  const sections = draft.sections.map(section => {
    const mapping = source.sections[section.sectionId];
    if (!mapping || Object.keys(mapping.initialPageByQuestion).length !== section.questions.length) throw new Error('Missing original question mapping');
    const lookup = (kind: 'questions' | 'script', pages: number[]) => pages.map(number => {
      const page = source[kind].pages[String(number)];
      if (!page || page.page !== number || page.src !== `/exams/${draft.examId}/${kind}/page-${String(number).padStart(2, '0')}.png`) throw new Error('Invalid original page');
      return sourcePageSchema.parse(page); // Keep import hashes out of the public payload.
    });
    const pages = lookup('questions', mapping.pages);
    const reviewPages = lookup('script', mapping.scriptPages);
    const listening = section.title.includes('聴解');
    const choiceCount = listening && /問題[4４5５]/.test(section.title) ? 3 : 4;
    if (mapping.choiceCount !== choiceCount || (listening && !reviewPages.length)) throw new Error('Invalid original choice/script mapping');
    if (source.questions.pdfUrl !== `/exams/${draft.examId}/questions.pdf`) throw new Error('Invalid original PDF');
    return { ...section, instructions: listening
      ? 'Nghe MP3 toàn bài, xem câu/hình trong đề gốc và chọn số đáp án tương ứng. Phần 3 và 5 có câu hỏi/lựa chọn trong audio.'
      : 'Đọc câu hỏi, đoạn văn và các lựa chọn trong trang đề gốc, rồi chọn số đáp án tương ứng.',
      materials: [], questions: section.questions.map(q => {
        const initialPage = mapping.initialPageByQuestion[q.questionId];
        if (!pages.some(p => p.page === initialPage) || !q.correctChoiceIds?.length
          || q.correctChoiceIds.some(id => !Array.from({ length: choiceCount }, (_, i) => String(i + 1)).includes(id))) throw new Error('Invalid original question/answer mapping');
        resolved.add(q.questionId);
        return { ...q, stem: `${section.title} · ${q.originalNumber}番`, materialIds: [],
          choices: Array.from({ length: choiceCount }, (_, i) => ({ choiceId: String(i + 1), text: `Đáp án ${i + 1}` })),
          sourcePages: pages, initialPage, sourcePdf: source.questions.pdfUrl, reviewPages,
          questionSource: `${source.questions.fileName}, trang ${mapping.pages.join(', ')}${listening ? '; câu hỏi/lựa chọn nghe trong MP3 gốc' : ''}`,
        };
      }),
    };
  });
  // OCR issues are resolved by showing the original page, never by guessing missing text.
  // The untouched JSON still keeps the original issues and provenance for audit.
  return { ...draft, sections, issues: draft.issues.filter(i => !i.questionId || !resolved.has(i.questionId)) };
}
