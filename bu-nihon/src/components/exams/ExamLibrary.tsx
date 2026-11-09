'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, BookOpen, CheckCircle2, ClipboardCheck, Headphones, Layers3, Play, Sparkles } from 'lucide-react';
import type { ExamSummary } from '@/lib/exams/model';
import { examStorageKey, useExamIdentity, useExamStore } from '@/lib/exams/store';
import './exams.css';

function ExamArtwork() {
  return <svg viewBox="0 0 320 260" fill="none" aria-hidden="true" className="exam-artwork">
    <circle cx="166" cy="129" r="108" fill="currentColor" opacity=".07" />
    <circle cx="275" cy="54" r="6" fill="#a5b4fc" /><circle cx="46" cy="199" r="9" fill="#93c5fd" />
    <g transform="translate(81 28) rotate(9 90 110)"><rect x="9" y="13" width="161" height="210" rx="18" fill="#818cf8" opacity=".15" />
      <rect width="161" height="210" rx="18" fill="white" stroke="#dbeafe" strokeWidth="2" />
      <rect x="39" y="-8" width="83" height="25" rx="10" fill="#6366f1" />
      <text x="24" y="63" fill="#1e3a8a" fontSize="27" fontWeight="800" fontFamily="sans-serif">JLPT</text>
      <rect x="109" y="40" width="32" height="25" rx="8" fill="#eef2ff" /><text x="115" y="58" fill="#6366f1" fontSize="14" fontWeight="700">N3</text>
      {[87, 120, 153].map((y, i) => <g key={y}><rect x="24" y={y} width="19" height="19" rx="6" fill={i === 2 ? '#f1f5f9' : '#dbeafe'} />
        {i !== 2 && <path d={`M29 ${y + 9}l4 4 6-7`} stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        <rect x="54" y={y + 3} width={i === 1 ? 62 : 79} height="5" rx="2.5" fill="#cbd5e1" /><rect x="54" y={y + 13} width="49" height="4" rx="2" fill="#e2e8f0" /></g>)}
    </g><g transform="translate(232 127) rotate(24)"><rect width="16" height="107" rx="7" fill="#fbbf24" /><path d="M0 99h16l-8 20z" fill="#fed7aa" /><path d="m5 114 3 5 3-5" fill="#334155" /><rect width="16" height="16" rx="5" fill="#fda4af" /></g>
    <g transform="translate(49 77)"><circle r="24" fill="#3b82f6" /><path d="m-10 0 7 7L11-7" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>
  </svg>;
}

export function ExamLibrary({ exams }: { exams: ExamSummary[] }) {
  const [filter, setFilter] = useState('all');
  const { hydrated, scope, error } = useExamIdentity();
  const entries = useExamStore(state => state.entries);
  const historyCount = hydrated ? exams.reduce((n, exam) => n + (entries[examStorageKey(scope, exam.examId)]?.history.length ?? 0), 0) : 0;
  const readyCount = exams.reduce((n, exam) => n + exam.readyCount, 0);
  const recommended = [...exams].sort((a, b) => b.readyCount - a.readyCount)[0];
  const filtered = exams.filter(exam => {
    const entry = hydrated ? entries[examStorageKey(scope, exam.examId)] : undefined;
    if (filter === 'unfinished') return Boolean(entry?.active && !entry.active.report);
    if (filter === 'completed') return Boolean(entry?.history.length);
    return true;
  });
  return <div className="exam-root">
    <header className="exam-hero">
      <div className="exam-hero-copy"><span className="exam-eyebrow"><Sparkles size={15} /> PHÒNG LUYỆN JLPT</span>
        <h1>Mỗi lần luyện đề,<br /><span>thêm một lần tự tin.</span></h1>
        <p>Chọn đề, tập trung làm bài và nhìn lại những gì bạn đã học. Một bước nhỏ hôm nay, vững vàng hơn ngày thi.</p>
        {recommended && <Link href={`/exams/${recommended.examId}`} className="exam-button primary">Bắt đầu luyện ngay <ArrowUpRight size={18} /></Link>}
        <div className="exam-hero-foot"><span><CheckCircle2 size={15} /> Chấm bài sau khi nộp</span><span><Layers3 size={15} /> Lưu tiến trình trên thiết bị</span></div>
      </div><ExamArtwork />
    </header>
    <div className="exam-stats"><div><span className="exam-stat-icon blue"><BookOpen size={22} /></span><div><strong>{exams.length.toString().padStart(2, '0')}</strong><span>Bộ đề JLPT N3</span></div></div>
      <div><span className="exam-stat-icon violet"><ClipboardCheck size={22} /></span><div><strong>{readyCount}</strong><span>Câu đang mở luyện</span></div></div>
      <div><span className="exam-stat-icon green"><CheckCircle2 size={22} /></span><div><strong>{historyCount.toString().padStart(2, '0')}</strong><span>Lượt bạn đã hoàn thành</span></div></div></div>
    {error && <p className="exam-notice" role="alert">{error}</p>}
    <section aria-labelledby="exam-library-title"><div className="exam-section-heading"><div><span className="exam-eyebrow">THƯ VIỆN ĐỀ THI</span><h2 id="exam-library-title">Chọn một đề để bắt đầu</h2></div><span className="exam-level-pill">JLPT <strong>N3</strong></span></div>
      <div className="exam-library-tools"><div className="exam-tabs" aria-label="Lọc đề thi">{[['all', 'Tất cả đề'], ['unfinished', 'Đang làm'], ['completed', 'Đã hoàn thành']].map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div><span className="exam-muted">{filtered.length} bộ đề</span></div>
      <div className="exam-card-grid">{filtered.map((exam, index) => {
        const entry = hydrated ? entries[examStorageKey(scope, exam.examId)] : undefined;
        const active = entry?.active; const ongoing = active && !active.report && active.revision === exam.revision;
        const last = entry?.history[0]; const date = exam.examId.replace('exam-', '').split('-');
        return <article key={exam.examId} className={`exam-library-card tone-${exams.indexOf(exam) % 3}`}>
          <div className="exam-card-cover"><span className="exam-cover-brand">日本語能力試験 <small>JLPT N3</small></span><div className="exam-cover-date"><span>{date[0]}</span><strong>{date[1]}<span>月</span></strong></div><ClipboardCheck size={86} strokeWidth={1} className="exam-cover-icon" />
            <span className="exam-cover-label">{exam.examId === exams[0]?.examId ? 'KỲ THI MỚI NHẤT' : 'BỘ ĐỀ LUYỆN TẬP'}</span></div>
          <div className="exam-card-body"><div className="exam-card-meta"><span className="exam-n3">N3</span><span>{exam.readyCount} câu có thể luyện</span></div><h3>{exam.title}</h3><p>Chọn phần bạn muốn ôn và luyện theo nhịp của mình.</p>
            <div className="exam-card-skills">{exam.categories.filter(c => c.readyCount).map(c => <span key={c.category}>{c.category === 'vocabulary' ? 'Từ vựng' : c.category === 'grammar' ? 'Ngữ pháp' : c.category === 'reading' ? 'Đọc hiểu' : 'Nghe hiểu'}</span>)}{exam.listeningAudio && <span><Headphones size={12} /> MP3 toàn bài</span>}</div>
            {ongoing ? <div className="exam-card-progress"><div><span>Bài đang làm</span><strong>{Object.values(active.answers).filter(a => a.length).length}/{active.questionIds.length}</strong></div><progress value={Object.values(active.answers).filter(a => a.length).length} max={active.questionIds.length} /></div>
              : <div className="exam-card-last">{last?.report ? <><CheckCircle2 size={15} /><span>Lần gần nhất: <strong>{last.report.correct}/{last.report.total} câu đúng</strong></span></> : <><Play size={14} /><span>Sẵn sàng cho lượt làm đầu tiên</span></>}</div>}
            <Link className={`exam-button ${index === 0 ? 'primary' : 'secondary'} full`} href={`/exams/${exam.examId}`}>{ongoing ? 'Tiếp tục bài làm' : active?.report ? 'Xem kết quả' : 'Chọn đề này'}<ArrowUpRight size={17} /></Link>
          </div></article>;
      })}</div>
      {!filtered.length && <div className="exam-empty"><BookOpen size={36} /><h3>{filter === 'unfinished' ? 'Bạn chưa có bài đang làm' : 'Chưa có lượt hoàn thành'}</h3><p>Chọn một bộ đề trong thư viện để bắt đầu hành trình.</p><button className="exam-button secondary" onClick={() => setFilter('all')}>Xem tất cả đề</button></div>}
    </section>
    <aside className="exam-data-note"><span className="exam-stat-icon amber"><Headphones size={23} /></span><div><strong>Đầy đủ đề gốc, MP3 và đáp án</strong><p>{readyCount} câu hiển thị nội dung và lựa chọn trực tiếp, hình nghe riêng và đoạn đọc đầy đủ. Có ghi chú bằng bút, furigana theo nguồn và script nghe sau khi nộp.</p></div><span className="exam-soft-badge">JLPT N3</span></aside>
    <p className="exam-footnote">Kết quả thể hiện số câu đúng theo đáp án được cung cấp, không quy đổi thành điểm JLPT chính thức. Lịch sử được lưu trên trình duyệt này.</p>
  </div>;
}
