import { z } from 'zod';
import type { ExamDraft } from './schema';

export const verifiedAnswersSchema = z.object({
  sourceFile: z.string().min(1), sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  exams: z.record(z.string(), z.object({ page: z.number().int().positive(),
    sections: z.record(z.string(), z.string().regex(/^[1-4]+$/)) })),
});
export type VerifiedAnswers = z.infer<typeof verifiedAnswersSchema>;

// Original numbering restarts for grammar and each listening group.
const ranges: Record<string, [number, number]> = {
  s01: [1, 8], s02: [9, 6], s03: [15, 11], s04: [26, 5], s05: [31, 5],
  s06: [1, 13], s07: [14, 5], s08: [19, 4], s09: [23, 4], s10: [27, 6],
  s11: [33, 4], s12: [37, 2], s13: [1, 6], s14: [1, 6], s15: [1, 3], s16: [1, 4], s17: [1, 9],
};

export function applyVerifiedAnswers(draft: ExamDraft, bank: VerifiedAnswers): ExamDraft {
  const verified = bank.exams[draft.examId];
  if (!verified) throw new Error(`Missing verified answers: ${draft.examId}`);
  if (draft.sections.length !== Object.keys(ranges).length
    || Object.keys(verified.sections).length !== Object.keys(ranges).length) throw new Error('Incomplete answer sections');
  return { ...draft, sections: draft.sections.map(section => {
    const range = ranges[section.sectionId]; const answers = verified.sections[section.sectionId];
    if (!range || !answers || answers.length !== range[1] || section.questions.length !== range[1]) throw new Error(`Answer count mismatch: ${section.sectionId}`);
    const expectedNumbers = Array.from({ length: range[1] }, (_, index) => String(range[0] + index));
    if (new Set(section.questions.map(q => q.originalNumber)).size !== range[1]
      || section.questions.some(q => !expectedNumbers.includes(q.originalNumber))) throw new Error(`Question numbering mismatch: ${section.sectionId}`);
    return { ...section, questions: section.questions.map(question => ({ ...question,
      correctChoiceIds: [answers[Number(question.originalNumber) - range[0]]],
      answerSource: `${bank.sourceFile}, trang ${verified.page}`,
    })) };
  }) };
}
