'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, Check, Clock3, Grid2X2, Loader2, PenLine, RotateCcw, ShieldCheck, Trash2, X } from 'lucide-react';
import { submitExam } from '@/lib/exams/client';
import { categoryLabels, formatTime, selectedQuestions, type PublicExam } from '@/lib/exams/model';
import { useExamStore, type ExamSession } from '@/lib/exams/store';
import { ExamAudioPlayer } from './ExamAudioPlayer';
import { ExamQuestion, RichExamText } from './ExamQuestion';
import { ExamInk } from './ExamInk';
import './paper.css';

function PaperDialog({ children, label, onClose, className = '' }: { children: React.ReactNode; label: string; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className={`exam-paper-dialog ${className}`} aria-label={label} onCancel={event => { event.preventDefault(); onClose(); }}><button className="exam-paper-dialog-close" autoFocus onClick={onClose} aria-label="Đóng"><X size={20} /></button>{children}</dialog>;
}

export function ExamPaperRunner({ exam, session, storageKey, reload, onReset, canSave }: {
  exam: PublicExam; session: ExamSession; storageKey: string; reload: () => void; onReset: () => void; canSave: boolean;
}) {
  const questions = selectedQuestions(exam, session.sectionIds);
  const sections = exam.sections.filter(s => session.sectionIds.includes(s.sectionId));
  const [now, setNow] = useState(() => Date.now());
  const [furigana, setFurigana] = useState(false); const [pen, setPen] = useState(false);
  const [progress, setProgress] = useState(false); const [confirm, setConfirm] = useState<'submit' | 'reset' | null>(null);
  const submitting = useRef(false); const autoSubmitted = useRef(false); const resumed = useRef(false);
  const expired = Boolean(session.deadline && now >= session.deadline);
  const answered = questions.filter(q => session.answers[q.questionId]?.length).length;
  const strokes = Object.values(session.ink ?? {}).reduce((n, paths) => n + paths.length, 0);
  const mutation = useMutation({ mutationFn: () => submitExam(exam.examId, session.revision, session.sectionIds, session.answers), retry: false,
    onSuccess: report => { useExamStore.getState().finish(storageKey, session.id, report); window.scrollTo({ top: 0 }); },
    onSettled: () => { submitting.current = false; } });
  const locked = mutation.isPending || expired;
  useEffect(() => {
    const tick = () => setNow(Date.now()); const timer = window.setInterval(tick, 1000);
    window.addEventListener('focus', tick); document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); window.removeEventListener('focus', tick); document.removeEventListener('visibilitychange', tick); };
  }, []);
  useEffect(() => {
    if (expired && !autoSubmitted.current && !submitting.current) { autoSubmitted.current = true; submitting.current = true; mutation.mutate(); }
  }, [expired, mutation]);
  useEffect(() => {
    if (resumed.current) return; resumed.current = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (session.cursor === 0) window.scrollTo({ top: 0, behavior: 'instant' });
      else document.getElementById(`paper-${questions[session.cursor]?.questionId}`)?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }));
  }, [questions, session.cursor]);
  const send = () => { if (!submitting.current) { submitting.current = true; mutation.mutate(); } setConfirm(null); };
  const jump = (index: number) => {
    useExamStore.getState().jump(storageKey, index); setProgress(false);
    requestAnimationFrame(() => { const card = document.getElementById(`paper-${questions[index].questionId}`); card?.focus({ preventScroll: true }); card?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  };
  const categories = [...new Set(sections.map(s => s.category))];
  const title = categories.every(c => c === 'vocabulary') ? 'KANJI · TỪ VỰNG' : categories.every(c => c === 'grammar' || c === 'reading') ? 'NGỮ PHÁP · ĐỌC HIỂU' : categories.every(c => c === 'listening') ? 'NGHE HIỂU' : 'LUYỆN ĐỀ JLPT N3';
  return <div className={`exam-paper-runner ${furigana ? '' : 'exam-hide-furigana'}`}>
    <header className="exam-paper-toolbar"><Link className="exam-paper-back" href="/exams" aria-label="Về thư viện đề"><ArrowLeft size={23} /></Link>
      <button className="exam-paper-submit" disabled={mutation.isPending} onClick={() => expired ? send() : setConfirm('submit')}>{mutation.isPending ? <Loader2 className="exam-spin" size={18} /> : null}{mutation.isPending ? 'Đang chấm…' : 'NỘP BÀI'}</button>
      <div className="exam-paper-tools"><span className={`exam-paper-time ${session.deadline && session.deadline - now < 300000 ? 'urgent' : ''}`} title={session.deadline ? 'Thời gian còn lại' : 'Thời gian đã làm'}><Clock3 size={18} />{formatTime((session.deadline ? session.deadline - now : now - session.startedAt) / 1000)}</span>
        <button className={pen ? 'active' : ''} aria-pressed={pen} disabled={locked} onClick={() => setPen(value => !value)}><PenLine size={24} /><span>Bút vẽ</span></button>
        <button role="switch" aria-checked={furigana} aria-label="Furigana" title="Hiện cách đọc có sẵn trong PDF gốc" onClick={() => setFurigana(value => !value)}><i className={`exam-furigana-switch ${furigana ? 'active' : ''}`} /><span>Furigana</span></button>
        <button onClick={() => setProgress(true)} aria-label="Tiến độ"><Grid2X2 size={23} /><span>Tiến độ</span><b>{answered}/{questions.length}</b></button>
      </div>
    </header>
    <div className="exam-paper-body"><section className="exam-paper-hero"><h1>{exam.title} · {title}</h1><div><span>N3</span><span>{questions.length} câu</span></div><p><ShieldCheck size={13} />{canSave ? 'Bài làm và nét vẽ được tự lưu trên thiết bị' : 'Chưa lưu được trên thiết bị'}</p></section>
      {!canSave && <p className="exam-notice" role="alert">Trình duyệt chưa lưu được bài làm. Đừng đóng trang trước khi nộp bài.</p>}
      {pen && !locked && <div className="exam-paper-pen-note" role="status"><PenLine size={17} /><span>Bút đang bật: kéo trên câu hỏi để ghi chú. Tắt bút để chọn đáp án. {strokes}/200 nét.</span><button onClick={() => useExamStore.getState().clearInk(storageKey)}><Trash2 size={15} />Xóa nét vẽ</button><button onClick={() => setPen(false)}>Xong<Check size={15} /></button></div>}
      {expired && <p className="exam-notice" role="status">{mutation.isError ? 'Đã hết giờ. Bài làm được giữ nguyên; hãy thử nộp lại.' : 'Đã hết giờ. Đang nộp bài để chấm điểm.'}</p>}
      {mutation.isError && <div className="exam-notice" role="alert">{mutation.error.message} Bài làm vẫn được giữ.<button className="exam-text-button" onClick={send}>Thử nộp lại</button><button className="exam-text-button" onClick={reload}>Cập nhật đề</button></div>}
      {sections.map(section => <section className={`exam-paper-section category-${section.category}`} key={section.sectionId} aria-label={section.title}>
        {section.sectionId === sections.find(item => item.category === 'listening')?.sectionId && <ExamAudioPlayer audio={exam.listeningAudio} title={exam.title} follow />}
        <h2 className="exam-paper-instruction" lang="ja">{section.instructions}</h2>
        {section.questions.map((question, localIndex) => {
          const index = questions.findIndex(q => q.questionId === question.questionId);
          const previous = section.questions[localIndex - 1];
          const passage = question.content?.passage ?? [];
          const showPassage = passage.length > 0 && JSON.stringify(passage) !== JSON.stringify(previous?.content?.passage);
          return <div key={question.questionId}>
            {showPassage && <article className="exam-native-passage exam-paper-passage" lang="ja"><RichExamText tokens={passage} /></article>}
            <article className={`exam-paper-question ${session.answers[question.questionId]?.length ? 'has-answer' : ''}`} id={`paper-${question.questionId}`} tabIndex={-1}>
              <div className="exam-paper-question-meta"><span className="exam-paper-number">{section.category === 'listening' ? `${section.title.match(/\d+/)?.[0]}-${question.originalNumber}` : question.originalNumber}</span><small>{categoryLabels[section.category]}</small><button className={session.flags.includes(question.questionId) ? 'active' : ''} aria-label={`Đánh dấu câu ${index + 1}`} aria-pressed={session.flags.includes(question.questionId)} disabled={locked} onClick={() => useExamStore.getState().flag(storageKey, question.questionId)}><Bookmark size={17} /></button></div>
              <ExamQuestion question={question} selected={session.answers[question.questionId] ?? []} locked={locked || pen} showPassage={false} onChange={choices => { useExamStore.getState().answer(storageKey, question.questionId, choices); useExamStore.getState().jump(storageKey, index); }} />
              {Boolean(session.answers[question.questionId]?.length) && <button className="exam-text-button exam-paper-clear" disabled={locked || pen} onClick={() => useExamStore.getState().answer(storageKey, question.questionId, [])}>Xóa lựa chọn</button>}
              <ExamInk enabled={pen && !locked && strokes < 200} paths={session.ink?.[question.questionId] ?? []} onStroke={path => useExamStore.getState().addInk(storageKey, question.questionId, path)} />
            </article>
          </div>;
        })}
      </section>)}
      <footer className="exam-paper-bottom"><span>Đã trả lời {answered}/{questions.length} câu</span><button className="exam-button primary" disabled={mutation.isPending} onClick={() => expired ? send() : setConfirm('submit')}>Nộp và chấm bài</button><button className="exam-text-button" disabled={mutation.isPending} onClick={() => setConfirm('reset')}><RotateCcw size={15} />Chọn lại phần luyện</button></footer>
    </div>
    {progress && <PaperDialog label="Tiến độ làm bài" onClose={() => setProgress(false)} className="exam-paper-progress"><h2>Tiến độ làm bài</h2><p>{answered}/{questions.length} câu đã chọn · {session.flags.length} câu đánh dấu</p><progress value={answered} max={questions.length} />
      <div className="exam-answer-grid">{questions.map((q, index) => <button key={q.questionId} aria-label={`Câu ${index + 1}${session.answers[q.questionId]?.length ? ', đã chọn' : ', chưa chọn'}`} className={`${session.answers[q.questionId]?.length ? 'answered' : ''} ${session.flags.includes(q.questionId) ? 'flagged' : ''}`} onClick={() => jump(index)}>{index + 1}{session.flags.includes(q.questionId) && <span />}</button>)}</div><p>Chọn số câu để chuyển đến vị trí đó.</p></PaperDialog>}
    {confirm && <PaperDialog label={confirm === 'submit' ? 'Xác nhận nộp bài' : 'Chọn lại phần luyện'} onClose={() => setConfirm(null)}><h2>{confirm === 'submit' ? 'Sẵn sàng xem kết quả?' : 'Bắt đầu lượt mới?'}</h2><p>{confirm === 'submit' ? `Bạn đã trả lời ${answered}/${questions.length} câu. Còn ${questions.length - answered} câu bỏ trống.` : 'Đáp án và nét vẽ của lượt hiện tại sẽ được xóa. Lịch sử đã hoàn thành vẫn được giữ.'}</p><div className="exam-dialog-actions"><button className="exam-button secondary" onClick={() => setConfirm(null)}>Quay lại</button><button className="exam-button primary" onClick={confirm === 'submit' ? send : onReset}>{confirm === 'submit' ? 'Nộp và chấm bài' : 'Chọn lại phần'}</button></div></PaperDialog>}
  </div>;
}
