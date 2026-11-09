import { z } from 'zod';
import { nativeQuestionSchema, type ExamDraft, type ExamText } from './schema.ts';

export const nativeContentSchema = z.object({ formatVersion: z.literal(1), exams: z.record(z.string(), z.object({
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  sections: z.record(z.string(), z.object({ instructions: z.string().min(1), questions: z.record(z.string(), nativeQuestionSchema) })),
})) });
export function textOf(tokens: ExamText) { return tokens.map(token => token.text).join(''); }

export function applyNativeContent(draft: ExamDraft, input: z.infer<typeof nativeContentSchema>, sourceHash: string): ExamDraft {
  const bank = input.exams[draft.examId];
  if (!bank || bank.sourceSha256 !== sourceHash || Object.keys(bank.sections).length !== draft.sections.length) throw new Error('Native exam source mismatch');
  return { ...draft, sections: draft.sections.map(section => {
    const native = bank.sections[section.sectionId];
    if (!native || Object.keys(native.questions).length !== section.questions.length) throw new Error('Incomplete native exam section');
    return { ...section, instructions: native.instructions.replace(/\n/g, '').replace(/\s+/g, ' '), questions: section.questions.map(q => {
      const content = native.questions[q.questionId];
      if (!content || !textOf(content.stem).trim() || Object.keys(content.choices).length !== q.choices.length
        || q.choices.some(c => !content.choices[c.choiceId] || !textOf(content.choices[c.choiceId]).trim())) throw new Error('Incomplete native exam question');
      return { ...q, content, stem: textOf(content.stem), choices: q.choices.map(c => ({ ...c, text: textOf(content.choices[c.choiceId]) })) };
    }) };
  }) };
}
