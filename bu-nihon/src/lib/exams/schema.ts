import { z } from 'zod';

const choice = z.object({ choiceId: z.string(), text: z.string().nullable() });
export const sourcePageSchema = z.object({
  page: z.number().int().positive(),
  src: z.string().regex(/^\/exams\/exam-\d{4}-\d{2}\/(questions|script)\/page-\d{2}\.png$/),
  width: z.number().int().positive(), height: z.number().int().positive(),
});
export type SourcePage = z.infer<typeof sourcePageSchema>;
export const examDraftSchema = z.object({
  examId: z.string(), title: z.string(), level: z.string(), durationMinutes: z.number().positive().nullable(),
  sections: z.array(z.object({
    sectionId: z.string(), title: z.string(), instructions: z.string().nullable(),
    materials: z.array(z.object({ materialId: z.string(), type: z.enum(['text', 'image', 'audio']),
      text: z.string().nullable(), assetFile: z.string().nullable(), source: z.string().nullable() })),
    questions: z.array(z.object({ questionId: z.string(), originalNumber: z.string(), type: z.string(),
      stem: z.string().nullable(), materialIds: z.array(z.string()), choices: z.array(choice),
      correctChoiceIds: z.array(z.string()).nullable(), questionSource: z.string().nullable(), answerSource: z.string().nullable(),
      sourcePages: z.array(sourcePageSchema).optional(), initialPage: z.number().int().positive().optional(),
      sourcePdf: z.string().regex(/^\/exams\/exam-\d{4}-\d{2}\/questions\.pdf$/).optional(),
      reviewPages: z.array(sourcePageSchema).optional(),
    })),
  })),
  issues: z.array(z.object({ questionId: z.string().nullable().optional(), problem: z.string(), source: z.string().nullable().optional() })),
}).superRefine((exam, ctx) => {
  for (const ids of [exam.sections.map(s => s.sectionId), exam.sections.flatMap(s => s.questions.map(q => q.questionId))]) {
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', message: 'Duplicate section/question ID' });
  }
});
export type ExamDraft = z.infer<typeof examDraftSchema>;

export const submissionSchema = z.object({
  revision: z.string().max(64),
  sectionIds: z.array(z.string().max(64)).min(1).max(30),
  answers: z.record(z.string().max(64), z.array(z.string().max(16)).max(4)).refine(a => Object.keys(a).length <= 200),
}).strict();

export const reportSchema = z.object({
  total: z.number().int().nonnegative(), answered: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(), wrong: z.number().int().nonnegative(), unanswered: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
  sections: z.array(z.object({ sectionId: z.string(), title: z.string(), total: z.number(), correct: z.number() })),
  questions: z.array(z.object({ questionId: z.string(), selectedChoiceIds: z.array(z.string()), correctChoiceIds: z.array(z.string()),
    isCorrect: z.boolean(), questionSource: z.string().nullable(), answerSource: z.string().nullable(), reviewPages: z.array(sourcePageSchema).optional() })),
});
export type ExamReport = z.infer<typeof reportSchema>;

export const publicExamSchema = z.object({
  examId: z.string(), title: z.string(), level: z.string(), revision: z.string(), durationMinutes: z.number().nullable(),
  sourceCount: z.number().int().nonnegative(), readyCount: z.number().int().nonnegative(), blockedCount: z.number().int().nonnegative(),
  listeningAudio: z.object({ src: z.string().regex(/^\/exams\/exam-\d{4}-\d{2}\/listening\.mp3$/), fileName: z.string() }).nullable(),
  sections: z.array(z.object({ sectionId: z.string(), title: z.string(), instructions: z.string(),
    category: z.enum(['vocabulary', 'grammar', 'reading', 'listening']), sourceCount: z.number().int().nonnegative(), blockedCount: z.number().int().nonnegative(),
    questions: z.array(z.object({ questionId: z.string(), originalNumber: z.string(), type: z.enum(['single_choice', 'multiple_choice']), stem: z.string(),
      choices: z.array(z.object({ choiceId: z.string(), text: z.string() })), materials: z.array(z.object({ materialId: z.string(), text: z.string() })),
      sourcePages: z.array(sourcePageSchema).optional(), initialPage: z.number().int().positive().optional(),
      sourcePdf: z.string().regex(/^\/exams\/exam-\d{4}-\d{2}\/questions\.pdf$/).optional(),
    })),
  })),
});
