import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { examDraftSchema } from './schema.ts';
import { publicExam, gradeExam, selectedQuestions, formatTime } from './model.ts';
import { applyVerifiedAnswers, verifiedAnswersSchema } from './verified-answers.ts';
import { applySourcePages, sourceManifestSchema } from './source-pages.ts';
import { applyNativeContent, nativeContentSchema, textOf } from './native-content.ts';

const drafts = ['2025-07', '2025-12', '2026-07'].map(id => examDraftSchema.parse(
  JSON.parse(readFileSync(new URL(`../../data/exams/exam-${id}.json`, import.meta.url), 'utf8'))));
const verified = verifiedAnswersSchema.parse(JSON.parse(readFileSync(new URL('../../data/exams/verified-answers.json', import.meta.url), 'utf8')));
const sourceManifest = sourceManifestSchema.parse(JSON.parse(readFileSync(new URL('../../data/exams/source-pages.json', import.meta.url), 'utf8')));
const native = nativeContentSchema.parse(JSON.parse(readFileSync(new URL('../../data/exams/native-content.json', import.meta.url), 'utf8')));

test('all 303 native questions keep verified answers, complete passages, separate illustrations and original ruby', () => {
  for (const raw of drafts) {
    const original = applySourcePages(applyVerifiedAnswers(raw, verified), sourceManifest);
    const draft = applyNativeContent(original, native, sourceManifest.exams[raw.examId].questions.sha256);
    const exam = publicExam(draft, 'native'); assert.equal(exam.readyCount, 101);
    for (const section of exam.sections) for (const q of section.questions) {
      assert.ok(q.content); assert.equal(q.stem, textOf(q.content.stem));
      if (section.category !== 'listening') assert.ok(q.choices.every(c => !c.text.includes('Phương án')));
      assert.ok(q.choices.every(c => c.text.trim() && c.text === textOf(q.content!.choices[c.choiceId])));
      if (['s08', 's09', 's10', 's11'].includes(section.sectionId)) assert.ok(textOf(q.content.passage).length > 100);
      if (['s12', 's16'].includes(section.sectionId)) assert.ok(q.content.images.length > 0);
      for (const image of q.content.images) {
        const bytes = readFileSync(new URL(`../../../public${image.src}`, import.meta.url));
        assert.equal(bytes.readUInt32BE(16), image.width); assert.equal(bytes.readUInt32BE(20), image.height);
      }
    }
    const answers = Object.fromEntries(draft.sections.flatMap(s => s.questions).map(q => [q.questionId, q.correctChoiceIds!]));
    assert.equal(gradeExam(draft, 'native', exam.sections.map(s => s.sectionId), answers).correct, 101);
    assert.equal(JSON.stringify(exam).includes('/script/'), false);
  }
  const july = native.exams['exam-2025-07'].sections;
  assert.equal(textOf(july.s01.questions['s01-q001'].stem), '急に涙が出てしまいました。');
  assert.equal(textOf(july.s01.questions['s01-q001'].choices['1']), 'なみだ');
  assert.ok(textOf(july.s10.questions['s10-q028'].stem).includes('夏休み'));
  assert.equal(Object.keys(july.s08.questions['s08-q019'].choices).length, 4);
  const latest = native.exams['exam-2026-07'].sections;
  assert.ok(latest.s01.questions['s01-q001'].stem.some(t => t.underline && t.text.includes('計算')));
  assert.ok(latest.s01.questions['s01-q002'].stem.some(t => t.reading));
  assert.equal(latest.s16.questions['s16-q002'].images.length, 1);
  assert.equal(textOf(latest.s13.questions['s13-q001'].stem), '1番');
  const missing = structuredClone(native); delete missing.exams['exam-2025-07'].sections.s01.questions['s01-q001'];
  assert.throws(() => applyNativeContent(applySourcePages(applyVerifiedAnswers(drafts[0], verified), sourceManifest), missing, sourceManifest.exams['exam-2025-07'].questions.sha256));
});

test('original PDFs unlock all 303 questions with correct choice counts; scripts appear only after grading', () => {
  for (const raw of drafts) {
    const draft = examDraftSchema.parse(applySourcePages(applyVerifiedAnswers(raw, verified), sourceManifest));
    const exam = publicExam(draft, 'original');
    assert.equal(exam.readyCount, 101); assert.equal(exam.blockedCount, 0);
    assert.deepEqual(exam.sections.filter(s => s.category === 'listening').map(s => s.questions.length), [6, 6, 3, 4, 9]);
    for (const section of exam.sections) for (const q of section.questions) {
      assert.ok(q.sourcePages?.length); assert.ok(q.sourcePages.some(p => p.page === q.initialPage));
      assert.equal(q.choices.length, ['s16', 's17'].includes(section.sectionId) ? 3 : 4);
      assert.ok(q.sourcePages.every(p => p.src.includes(`/${draft.examId}/questions/`)));
    }
    assert.equal(JSON.stringify(exam).includes('/script/'), false);
    assert.equal(JSON.stringify(exam).includes('reviewPages'), false);
    assert.equal(JSON.stringify(exam).includes('correctChoiceIds'), false);
    const ids = exam.sections.map(s => s.sectionId);
    const correct = Object.fromEntries(draft.sections.flatMap(s => s.questions).map(q => [q.questionId, q.correctChoiceIds!]));
    const report = gradeExam(draft, 'original', ids, correct);
    assert.equal(report.total, 101); assert.equal(report.correct, 101); assert.equal(report.percentage, 100);
    assert.equal(report.questions.filter(q => q.reviewPages?.length).length, 28);
    assert.equal(gradeExam(draft, 'original', ids, {}).unanswered, 101);
    assert.throws(() => gradeExam(draft, 'original', ['s17'], { 's17-q001': ['4'] }));
    assert.equal(gradeExam(draft, 'original', ['s15'], { 's15-q001': ['4'] }).total, 3);
  }
  const missing = structuredClone(sourceManifest); delete missing.exams['exam-2025-07'].questions.pages['19'];
  assert.throws(() => applySourcePages(applyVerifiedAnswers(drafts[0], verified), missing));
  const wrong = structuredClone(sourceManifest); wrong.exams['exam-2025-07'].sections.s17.choiceCount = 4;
  assert.throws(() => applySourcePages(applyVerifiedAnswers(drafts[0], verified), wrong));
});

test('all 118 original/script image files and original PDFs match their import hashes and image dimensions', () => {
  let count = 0;
  for (const source of Object.values(sourceManifest.exams)) {
    for (const kind of ['questions', 'script'] as const) for (const page of Object.values(source[kind].pages)) {
      const bytes = readFileSync(new URL(`../../../public${page.src}`, import.meta.url));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), page.sha256);
      assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
      assert.equal(bytes.readUInt32BE(16), page.width); assert.equal(bytes.readUInt32BE(20), page.height);
      count++;
    }
    const pdf = readFileSync(new URL(`../../../public${source.questions.pdfUrl}`, import.meta.url));
    assert.equal(createHash('sha256').update(pdf).digest('hex'), source.questions.sha256);
  }
  assert.equal(count, 118);
});

test('PDF keys cover all 303 original question numbers without unlocking missing content or exposing answers', () => {
  let filled = 0;
  for (const original of drafts) {
    const draft = applyVerifiedAnswers(original, verified);
    for (const section of draft.sections) for (const q of section.questions) {
      assert.equal(q.correctChoiceIds?.length, 1);
      const before = original.sections.find(s => s.sectionId === section.sectionId)!.questions.find(item => item.questionId === q.questionId)!;
      if (before.correctChoiceIds === null) filled++;
      else assert.deepEqual(q.correctChoiceIds, before.correctChoiceIds);
      assert.ok(q.answerSource?.endsWith(`trang ${verified.exams[draft.examId].page}`));
    }
    const exam = publicExam(draft, 'verified');
    assert.equal(exam.readyCount, publicExam(original, 'raw').readyCount);
    assert.ok(exam.listeningAudio?.src.endsWith('/listening.mp3'));
    assert.equal(JSON.stringify(exam).includes('correctChoiceIds'), false);
    assert.ok(exam.sections.filter(s => s.category === 'listening').every(s => s.questions.length === 0));
    const playable = exam.sections.filter(s => s.questions.length);
    const answers = Object.fromEntries(draft.sections.flatMap(s => s.questions).filter(q => playable.some(s => s.questions.some(item => item.questionId === q.questionId))).map(q => [q.questionId, q.correctChoiceIds!]));
    assert.equal(gradeExam(draft, 'verified', playable.map(s => s.sectionId), answers).percentage, 100);
  }
  assert.equal(filled, 91);
  const missing = structuredClone(verified); delete missing.exams['exam-2025-07'].sections.s13;
  assert.throws(() => applyVerifiedAnswers(drafts[0], missing));
  const duplicate = structuredClone(drafts[0]); duplicate.sections[0].questions[1].originalNumber = '1';
  assert.throws(() => applyVerifiedAnswers(duplicate, verified));
  const reordered = structuredClone(drafts[0]); reordered.sections[0].questions.reverse();
  assert.deepEqual(applyVerifiedAnswers(reordered, verified).sections[0].questions.map(q => q.correctChoiceIds), [...drafts[0].sections[0].questions].reverse().map(q => q.correctChoiceIds));
});

test('all three imported drafts validate; incomplete/flagged questions never enter a scored attempt', () => {
  assert.deepEqual(drafts.map(d => publicExam(d, 'test').readyCount), [51, 12, 6]);
  for (const draft of drafts) {
    const exam = publicExam(draft, 'test');
    assert.equal(exam.sourceCount, 101);
    const flagged = new Set(draft.issues.map(i => i.questionId));
    assert.ok(exam.sections.flatMap(s => s.questions).every(q => !flagged.has(q.questionId)));
    assert.ok(exam.sections.filter(s => s.category === 'listening').every(s => !s.questions.length));
    assert.equal(JSON.stringify(exam).includes('correctChoiceIds'), false);
    assert.equal(JSON.stringify(exam).includes('answerSource'), false);
  }
});
test('grading is authoritative, unweighted and counts unanswered separately from wrong', () => {
  const draft = drafts[0]; const exam = publicExam(draft, 'test'); const section = exam.sections[0];
  const correct = draft.sections[0].questions[0].correctChoiceIds!;
  const report = gradeExam(draft, 'test', [section.sectionId], { [section.questions[0].questionId]: correct,
    [section.questions[1].questionId]: ['4'] });
  assert.equal(report.correct, 1); assert.equal(report.wrong, 1); assert.equal(report.unanswered, 6);
  assert.equal(report.total, 8); assert.equal(report.percentage, 13);
  const all = Object.fromEntries(draft.sections[0].questions.map(q => [q.questionId, q.correctChoiceIds!]));
  assert.equal(gradeExam(draft, 'test', [section.sectionId], all).percentage, 100);
});
test('tampered answers, duplicate sections and blocked-only selections are rejected', () => {
  const exam = publicExam(drafts[0], 'test');
  assert.throws(() => selectedQuestions(exam, ['s01', 's01']));
  assert.throws(() => selectedQuestions(exam, ['s13']));
  assert.throws(() => gradeExam(drafts[0], 'test', ['s01'], { 's01-q001': ['9'] }));
  assert.throws(() => gradeExam(drafts[0], 'test', ['s01'], { 's01-q001': ['1', '2'] }));
  assert.throws(() => gradeExam(drafts[0], 'test', ['s01'], { missing: ['1'] }));
});
test('missing referenced material and duplicate option text are quarantined even without a source issue', () => {
  const draft = structuredClone(drafts[0]);
  draft.sections[0].questions[0].materialIds = ['missing'];
  draft.sections[0].questions[1].choices[0].text = draft.sections[0].questions[1].choices[1].text;
  assert.equal(publicExam(draft, 'test').readyCount, 49);
  assert.equal(formatTime(-1), '00:00'); assert.equal(formatTime(3661), '61:01');
});
