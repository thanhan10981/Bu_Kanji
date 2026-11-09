'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, Headphones, History, Loader2, RotateCcw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { loadExam } from '@/lib/exams/client';
import { categoryLabels, formatTime, selectedQuestions, type PublicExam, type PublicSection } from '@/lib/exams/model';
import { examStorageKey, useExamIdentity, useExamStore, type ExamSession } from '@/lib/exams/store';
import './exams.css';
import { ExamAudioPlayer } from './ExamAudioPlayer';
import { ExamQuestion } from './ExamQuestion';
import { ExamPaperRunner } from './ExamPaperRunner';

function compatible(exam: PublicExam, session: ExamSession) {
  try { return session.revision === exam.revision && JSON.stringify(session.questionIds) === JSON.stringify(selectedQuestions(exam, session.sectionIds).map(q => q.questionId)); }
  catch { return false; }
}
function displayDate(timestamp: number) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(timestamp);
}
function AttemptHistory({ history, exam, onView }: { history: ExamSession[]; exam: PublicExam; onView: (session: ExamSession) => void }) {
  if (!history.length) return null;
  return <section className="exam-history"><div className="exam-section-heading"><h2><History size={20} /> Những lần bạn đã thử</h2><span className="exam-muted">Lưu trên thiết bị này</span></div>
    {history.map(session => <button key={session.id} disabled={!compatible(exam, session)} className="exam-history-row" onClick={() => onView(session)}>
      <span className="exam-history-mark"><CheckCircle2 size={20} /></span><span><strong>{displayDate(session.submittedAt ?? session.startedAt)}</strong><small>{session.questionIds.length} câu · {compatible(exam, session) ? 'Xem lại bài làm' : 'Phiên bản đề cũ'}</small></span><strong>{session.report?.correct}/{session.report?.total}</strong><ArrowRight size={17} />
    </button>)}
  </section>;
}

export function ExamWorkspace({ examId }: { examId: string }) {
  const identity = useExamIdentity();
  const query = useQuery({ queryKey: ['exam', examId], queryFn: () => loadExam(examId), retry: 1, staleTime: 300_000, refetchOnWindowFocus: false });
  if (query.isPending || !identity.hydrated) return <div className="exam-root exam-empty" role="status"><Loader2 className="exam-spin" size={30} /><h2>Đang chuẩn bị đề cho bạn…</h2><p>Khôi phục bài đã lưu và kiểm tra nội dung.</p></div>;
  if (query.isError) return <div className="exam-root exam-empty" role="alert"><BookOpen size={34} /><h2>Chưa tải được đề thi</h2><p>{query.error.message}</p><button className="exam-button primary" onClick={() => query.refetch()}>Thử lại</button><Link href="/exams">Về thư viện đề</Link></div>;
  return <Workspace key={`${identity.scope}:${examId}`} exam={query.data} scope={identity.scope} storageError={identity.error} reload={() => query.refetch()} />;
}
function Workspace({ exam, scope, storageError, reload }: { exam: PublicExam; scope: string; storageError: string; reload: () => void }) {
  const key = examStorageKey(scope, exam.examId);
  const entry = useExamStore(state => state.entries[key]);
  const [viewedId, setViewedId] = useState<string | null>(null);
  const viewed = viewedId ? entry?.history.find(session => session.id === viewedId) : undefined;
  const session = viewed ?? entry?.active;
  const clear = () => { setViewedId(null); useExamStore.getState().clear(key); };
  return <div className="exam-root">
    {storageError && <p className="exam-notice" role="alert">{storageError}</p>}
    {session && compatible(exam, session) ? session.report
      ? <Results key={session.id} exam={exam} session={session} onNew={clear} onBack={viewed ? () => setViewedId(null) : undefined} />
      : <ExamPaperRunner key={session.id} exam={exam} session={session} storageKey={key} reload={reload} onReset={clear} canSave={!storageError} />
      : <Setup exam={exam} storageKey={key} stale={Boolean(session)} />}
    {(!session || session.report || !compatible(exam, session)) && <AttemptHistory history={entry?.history ?? []} exam={exam} onView={item => { setViewedId(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
  </div>;
}
function Setup({ exam, storageKey, stale }: { exam: PublicExam; storageKey: string; stale: boolean }) {
  const available = exam.sections.filter(section => section.questions.length);
  const [sections, setSections] = useState(available.map(section => section.sectionId));
  const [minutes, setMinutes] = useState(0);
  const selectedCount = exam.sections.filter(section => sections.includes(section.sectionId)).reduce((n, section) => n + section.questions.length, 0);
  const start = () => useExamStore.getState().begin(storageKey, exam, sections, minutes);
  const toggle = (id: string) => setSections(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  return <>
    <Link href="/exams" className="exam-back"><ArrowLeft size={17} /> Thư viện đề thi</Link>
    <header className="exam-detail-heading"><span className="exam-eyebrow">MỘT CHÚT TẬP TRUNG, MỘT BƯỚC TIẾN BỘ</span><div><h1>{exam.title}</h1><span className="exam-level-pill">N3</span></div><p>Thiết lập lượt luyện phù hợp với bạn. Khi sẵn sàng, mình bắt đầu nhé.</p></header>
    {stale && <p className="exam-notice" role="status">Đề đã thay đổi hoặc bài lưu cũ không còn tương thích. Bắt đầu lượt mới để sử dụng nội dung hiện tại.</p>}
    <div className="exam-section-presets">{[
      { title: 'Kanji · Từ vựng', categories: ['vocabulary'], minutes: 30 },
      { title: 'Ngữ pháp · Đọc hiểu', categories: ['grammar', 'reading'], minutes: 70 },
      { title: 'Nghe hiểu', categories: ['listening'], minutes: 40 },
    ].map(preset => { const group = available.filter(section => preset.categories.includes(section.category)); return <button key={preset.title} onClick={() => { setSections(group.map(section => section.sectionId)); setMinutes(preset.minutes); }}><strong>{preset.title}</strong><small>{group.reduce((n, section) => n + section.questions.length, 0)} câu · {preset.minutes} phút luyện</small></button>; })}</div>
    <div className="exam-setup-grid"><section className="exam-panel exam-section-picker"><div className="exam-panel-title"><span className="exam-step">01</span><div><h2>Bạn muốn luyện phần nào?</h2><p>Chọn một hoặc nhiều nhóm câu hỏi.</p></div><button className="exam-text-button" onClick={() => setSections(sections.length === available.length ? [] : available.map(s => s.sectionId))}>{sections.length === available.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</button></div>
      {(Object.keys(categoryLabels) as (keyof typeof categoryLabels)[]).map(category => {
        const group = exam.sections.filter(section => section.category === category);
        const ready = group.filter(section => section.questions.length);
        const blocked = group.filter(section => !section.questions.length);
        return <div key={category} className="exam-category-group"><h3>{category === 'listening' ? <Headphones size={17} /> : <BookOpen size={17} />}{categoryLabels[category]}</h3>
          <div className="exam-section-options">{ready.map(section => <SectionOption key={section.sectionId} section={section} selected={sections.includes(section.sectionId)} toggle={toggle} />)}</div>
          {blocked.length > 0 && <details className="exam-locked-group"><summary>{blocked.length} nhóm chờ bổ sung <span>{blocked.reduce((n, section) => n + section.sourceCount, 0)} câu tạm khóa</span></summary><div className="exam-section-options">{blocked.map(section => <SectionOption key={section.sectionId} section={section} selected={false} toggle={toggle} />)}</div></details>}
        </div>;
      })}
    </section>
    <aside className="exam-setup-aside"><section className="exam-panel"><div className="exam-panel-title"><span className="exam-step">02</span><div><h2>Chọn nhịp làm bài</h2><p>Tự do hoặc thử sức với đồng hồ.</p></div></div>
      <div className="exam-duration-options">{[0, 15, 30, 40, 60, 70, 90].map(value => <button key={value} className={minutes === value ? 'active' : ''} aria-pressed={minutes === value} onClick={() => setMinutes(value)}><Clock3 size={16} />{value ? `${value} phút` : 'Không giới hạn'}{minutes === value && <Check size={15} />}</button>)}</div>
      <p className="exam-small-note">Thời gian do bạn tự chọn, không phải thời lượng của đề thi chính thức. Đồng hồ tiếp tục chạy khi bạn rời trang.</p>
      <div className="exam-start-summary"><div><span>Đã chọn</span><strong>{selectedCount} câu</strong></div><div><span>Thời gian</span><strong>{minutes ? `${minutes} phút` : 'Tự do'}</strong></div></div>
      <button className="exam-button primary full" disabled={!selectedCount} onClick={start}>Bắt đầu làm bài <ArrowRight size={18} /></button>
      {!selectedCount && <p className="exam-small-note" role="status">Chọn ít nhất một nhóm câu hỏi để bắt đầu.</p>}
    </section><ExamAudioPlayer audio={exam.listeningAudio} title={exam.title} /><aside className="exam-data-note compact"><ShieldCheck size={23} /><div><strong>Luyện theo từng câu</strong><p>{exam.readyCount}/{exam.sourceCount} câu với nội dung và lựa chọn trực tiếp; hình nghe được tách riêng. Bật/tắt furigana có sẵn trong nguồn, vẽ ghi chú và xem script sau khi nộp.</p></div></aside>
      <p className="exam-small-note">Bài đang làm và lịch sử được lưu riêng trên trình duyệt này. Bạn có thể trở lại để tiếp tục.</p>
    </aside></div>
    <div className="exam-mobile-start"><span><strong>{selectedCount} câu đã chọn</strong><small>{minutes ? `${minutes} phút` : 'Không giới hạn thời gian'}</small></span><button className="exam-button primary" disabled={!selectedCount} onClick={start}>Vào làm bài <ArrowRight size={17} /></button></div>
  </>;
}
function SectionOption({ section, selected, toggle }: { section: PublicSection; selected: boolean; toggle: (id: string) => void }) {
  return <label className={`exam-section-option ${!section.questions.length ? 'unavailable' : ''}`}>
    <input type="checkbox" disabled={!section.questions.length} checked={selected} onChange={() => toggle(section.sectionId)} />
    <span><strong lang="ja">{section.title}</strong><small>{section.questions.length ? `${section.questions.length} câu đủ dữ liệu` : 'Chờ bổ sung nội dung / đáp án'}{section.blockedCount > 0 && section.questions.length > 0 ? ` · ${section.blockedCount} câu tạm khóa` : ''}</small></span><span className="exam-section-count">{section.questions.length}/{section.sourceCount}</span>
  </label>;
}

function Results({ exam, session, onNew, onBack }: { exam: PublicExam; session: ExamSession; onNew: () => void; onBack?: () => void }) {
  const report = session.report!;
  const questions = selectedQuestions(exam, session.sectionIds);
  const [filter, setFilter] = useState('all');
  const filtered = questions.filter(q => { const result = report.questions.find(item => item.questionId === q.questionId); return filter === 'all' || (filter === 'correct' ? result?.isCorrect : !result?.isCorrect); });
  const ended = Math.min(session.submittedAt ?? session.startedAt, session.deadline ?? Infinity);
  return <>
    {onBack ? <button className="exam-back" onClick={onBack}><ArrowLeft size={17} />Quay lại lượt hiện tại</button> : <Link href="/exams" className="exam-back"><ArrowLeft size={17} />Thư viện đề thi</Link>}
    <header className="exam-result-hero"><div><span className="exam-eyebrow"><Sparkles size={15} /> MỘT LƯỢT LUYỆN, THÊM MỘT BƯỚC TIẾN</span><h1>Bạn đã hoàn thành!</h1><p>{exam.title} · {displayDate(session.submittedAt ?? session.startedAt)}</p><p>Nhìn lại những câu chưa đúng để lượt sau tiến bộ hơn nhé.</p><div className="exam-result-actions"><button className="exam-button primary" onClick={onNew}><RotateCcw size={17} />Luyện một lượt mới</button><a href="#exam-review" className="exam-button secondary">Xem lại bài làm<ArrowRight size={17} /></a></div></div>
      <div className="exam-score-ring" style={{ '--score': `${report.percentage}%` } as React.CSSProperties}><div><strong>{report.percentage}<span>%</span></strong><small>TỶ LỆ TRẢ LỜI ĐÚNG</small></div></div></header>
    <div className="exam-result-stats"><div><CheckCircle2 size={21} /><strong>{report.correct}</strong><span>Câu đúng</span></div><div><X size={21} /><strong>{report.wrong}</strong><span>Câu sai</span></div><div><BookOpen size={21} /><strong>{report.unanswered}</strong><span>Bỏ trống</span></div><div><Clock3 size={21} /><strong>{formatTime((ended - session.startedAt) / 1000)}</strong><span>Thời gian</span></div></div>
    <section className="exam-panel exam-breakdown"><div className="exam-panel-title"><h2>Kết quả theo từng phần</h2><span className="exam-muted">{report.correct}/{report.total} câu đúng</span></div><div className="exam-breakdown-grid">{report.sections.map(section => <div key={section.sectionId}><div><span lang="ja">{section.title}</span><strong>{section.correct}/{section.total}</strong></div><progress value={section.correct} max={section.total} /></div>)}</div><p className="exam-small-note">Chấm theo đáp án được cung cấp, mỗi câu có trọng số như nhau. Đây không phải điểm chuẩn hóa hay kết luận đỗ/trượt JLPT.</p></section>
    <ExamAudioPlayer audio={exam.listeningAudio} title={exam.title} collapsed />
    <section id="exam-review" className="exam-review"><div className="exam-section-heading"><div><span className="exam-eyebrow">HIỂU THÊM TỪ MỖI LẦN NHÌN LẠI</span><h2>Xem lại bài làm</h2></div></div><div className="exam-tabs" aria-label="Lọc kết quả">{[['all', `Tất cả (${report.total})`], ['wrong', `Cần ôn lại (${report.total - report.correct})`], ['correct', `Đã đúng (${report.correct})`]].map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
      {filtered.map(question => { const result = report.questions.find(q => q.questionId === question.questionId); return <article key={question.questionId} className="exam-panel exam-review-card"><div className="exam-question-topline"><span className="exam-question-position">Câu {questions.indexOf(question) + 1}</span><span className={`exam-result-badge ${result?.isCorrect ? 'positive' : ''}`}>{result?.isCorrect ? 'Chính xác' : !result?.selectedChoiceIds.length ? 'Bỏ trống' : 'Cần ôn lại'}</span></div><p className="exam-question-section" lang="ja">{question.sectionTitle} · Số câu gốc: {question.originalNumber}</p><ExamQuestion question={question} selected={result?.selectedChoiceIds ?? []} result={result} locked /></article>; })}
      {!filtered.length && <div className="exam-empty"><CheckCircle2 size={30} /><h3>Không có câu trong bộ lọc này</h3><p>Bạn có thể chuyển sang “Tất cả” để xem lại bài làm.</p></div>}
    </section>
  </>;
}
