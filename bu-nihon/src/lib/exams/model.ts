import type { ExamDraft, ExamReport, SourcePage, NativeQuestion } from './schema';
import { examAudio, type ExamAudio } from './audio.ts';

export type Category = 'vocabulary' | 'grammar' | 'reading' | 'listening';
export const categoryLabels: Record<Category, string> = { vocabulary: 'Từ vựng', grammar: 'Ngữ pháp', reading: 'Đọc hiểu', listening: 'Nghe hiểu' };
export function categoryOf(title: string): Category {
  if (title.includes('聴解')) return 'listening';
  if (title.includes('読解')) return 'reading';
  if (title.includes('文法')) return 'grammar';
  return 'vocabulary';
}
export interface PublicQuestion {
  questionId: string; originalNumber: string; type: 'single_choice' | 'multiple_choice'; stem: string;
  choices: { choiceId: string; text: string }[]; materials: { materialId: string; text: string }[];
  sourcePages?: SourcePage[]; initialPage?: number; sourcePdf?: string;
  content?: NativeQuestion;
}
export interface PublicSection {
  sectionId: string; title: string; category: Category; instructions: string;
  sourceCount: number; blockedCount: number; questions: PublicQuestion[];
}
export interface PublicExam {
  examId: string; title: string; level: string; revision: string; durationMinutes: number | null;
  sourceCount: number; readyCount: number; blockedCount: number; sections: PublicSection[];
  listeningAudio: ExamAudio | null;
}
export type ExamSummary = Omit<PublicExam, 'sections'> & {
  categories: { category: Category; readyCount: number; sourceCount: number }[];
};

export function publicExam(draft: ExamDraft, revision: string): PublicExam {
  const issues = new Set(draft.issues.map(issue => issue.questionId));
  const globalIssue = draft.issues.some(issue => !issue.questionId);
  const sections = draft.sections.map(section => {
    const questions = section.questions.filter(q => {
      if (globalIssue || issues.has(q.questionId) || !q.stem?.trim()) return false;
      if (!['single_choice', 'multiple_choice'].includes(q.type)) return false;
      // Listening groups 4 and 5 have three options, as printed in the original instructions.
      const choiceCount = categoryOf(section.title) === 'listening' && /問題[4４5５]/.test(section.title) ? 3 : 4;
      if (q.choices.length !== choiceCount || q.choices.some(c => !c.text?.trim())) return false;
      if (new Set(q.choices.map(c => c.choiceId)).size !== choiceCount
        || new Set(q.choices.map(c => c.text?.trim().normalize('NFKC'))).size !== choiceCount) return false;
      if (!q.correctChoiceIds?.length || new Set(q.correctChoiceIds).size !== q.correctChoiceIds.length) return false;
      if (q.type === 'single_choice' && q.correctChoiceIds.length !== 1) return false;
      if (q.correctChoiceIds.some(id => !q.choices.some(c => c.choiceId === id))) return false;
      return q.materialIds.every(id => {
        const material = section.materials.find(m => m.materialId === id);
        // Scored items require verified text. Full audio is available separately;
        // linking an MP3 alone does not supply missing question text or images.
        return material?.type === 'text' && Boolean(material.text?.trim());
      });
    }).map(q => ({
      questionId: q.questionId, originalNumber: q.originalNumber,
      type: q.type as PublicQuestion['type'], stem: q.stem!,
      choices: q.choices.map(c => ({ choiceId: c.choiceId, text: c.text! })),
      sourcePages: q.sourcePages, initialPage: q.initialPage, sourcePdf: q.sourcePdf,
      content: q.content,
      materials: q.materialIds.map(id => { const m = section.materials.find(item => item.materialId === id)!; return { materialId: id, text: m.text! }; }),
    }));
    return { sectionId: section.sectionId, title: section.title, category: categoryOf(section.title),
      instructions: section.instructions ?? '', sourceCount: section.questions.length,
      blockedCount: section.questions.length - questions.length, questions };
  });
  const sourceCount = sections.reduce((n, s) => n + s.sourceCount, 0);
  const readyCount = sections.reduce((n, s) => n + s.questions.length, 0);
  return { examId: draft.examId, title: draft.title, level: draft.level, revision,
    durationMinutes: draft.durationMinutes, sourceCount, readyCount, blockedCount: sourceCount - readyCount, sections, listeningAudio: examAudio(draft.examId) };
}
export function summarize(exam: PublicExam): ExamSummary {
  const { sections, ...summary } = exam;
  return { ...summary, categories: (Object.keys(categoryLabels) as Category[]).map(category => ({ category,
    readyCount: sections.filter(s => s.category === category).reduce((n, s) => n + s.questions.length, 0),
    sourceCount: sections.filter(s => s.category === category).reduce((n, s) => n + s.sourceCount, 0),
  })) };
}
export function selectedQuestions(exam: PublicExam, sectionIds: string[]) {
  if (!sectionIds.length || new Set(sectionIds).size !== sectionIds.length
    || sectionIds.some(id => !exam.sections.some(s => s.sectionId === id && s.questions.length))) {
    throw new Error('Phần được chọn không hợp lệ hoặc chưa có câu đủ dữ liệu.');
  }
  return exam.sections.filter(s => sectionIds.includes(s.sectionId)).flatMap(s => s.questions.map(q => ({ ...q, sectionId: s.sectionId, sectionTitle: s.title })));
}
export function gradeExam(draft: ExamDraft, revision: string, sectionIds: string[], answers: Record<string, string[]>): ExamReport {
  const exam = publicExam(draft, revision);
  const selected = selectedQuestions(exam, sectionIds);
  if (Object.keys(answers).some(id => !selected.some(q => q.questionId === id))) throw new Error('Bài làm chứa câu ngoài phần đã chọn.');
  const questions = selected.map(q => {
    const chosen = answers[q.questionId] ?? [];
    if (new Set(chosen).size !== chosen.length || (q.type === 'single_choice' && chosen.length > 1)
      || chosen.some(id => !q.choices.some(c => c.choiceId === id))) throw new Error('Lựa chọn trong bài làm không hợp lệ.');
    const source = draft.sections.flatMap(s => s.questions).find(item => item.questionId === q.questionId)!;
    const correctChoiceIds = source.correctChoiceIds!;
    return { questionId: q.questionId, selectedChoiceIds: chosen, correctChoiceIds,
      isCorrect: chosen.length === correctChoiceIds.length && chosen.every(id => correctChoiceIds.includes(id)),
      questionSource: source.questionSource, answerSource: source.answerSource, reviewPages: source.reviewPages };
  });
  const correct = questions.filter(q => q.isCorrect).length;
  const answered = questions.filter(q => q.selectedChoiceIds.length).length;
  return { total: questions.length, answered, correct, wrong: answered - correct,
    unanswered: questions.length - answered, percentage: Math.round(correct / questions.length * 100), questions,
    sections: exam.sections.filter(s => sectionIds.includes(s.sectionId)).map(s => ({ sectionId: s.sectionId, title: s.title,
      total: s.questions.length, correct: questions.filter(q => q.isCorrect && s.questions.some(item => item.questionId === q.questionId)).length })) };
}
export function formatTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
}
