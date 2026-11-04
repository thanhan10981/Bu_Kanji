"use client";
import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import type { SetDetail } from '@/lib/vocabulary/schemas';
import { summarizeStudyProgress } from '@/lib/vocabulary/progress';
import { useStudyProgress } from '@/lib/vocabulary/progress-store';

export function StudyReport({ set }: { set: SetDetail }) {
  const { hydrated, scope, entries, error } = useStudyProgress();
  const [showAll, setShowAll] = useState(false);
  if (!hydrated) return <p role="status">Đang tải báo cáo học tập…</p>;
  const report = summarizeStudyProgress(entries, scope, set.cards);
  const difficult = showAll ? report.difficult : report.difficult.slice(0, 5);
  return <section className="card study-report" aria-label={`Báo cáo tự luận ${set.name}`}>
    <header className="study-report-heading"><div><h2><BarChart3 size={23} /> Báo cáo Tự luận</h2><p className="vocab-hint">Lưu trên trình duyệt này · {scope === 'guest' ? 'Khách' : 'Tài khoản hiện tại'}</p></div>
      <strong className="study-report-percent">{report.percentage.toLocaleString('vi-VN')}% <small>đã thuộc</small></strong></header>
    <progress aria-label="Tỷ lệ đã thuộc của bài" max={report.total || 1} value={report.mastered} />
    <div className="study-report-metrics">
      <div><strong>{report.mastered}/{report.total}</strong><span>Từ đã thuộc</span></div>
      <div><strong>{report.totalWrong}</strong><span>Tổng lần sai</span></div>
      <div><strong>{report.learning}</strong><span>Từ cần ôn</span></div>
      <div><strong>{report.unseen}</strong><span>Từ chưa học</span></div>
    </div>
    <p className="vocab-hint">Đã thuộc = nhớ đúng ở lần trả lời gần nhất, không tính gõ lại theo đáp án. Trả lời sai sẽ đưa từ về cần ôn. Số lần sai cộng dồn qua các lượt, gồm cả khi sửa sai.</p>
    {error && <p role="alert" className="vocab-error">{error}</p>}
    {!report.studied ? <p className="study-report-empty">Chưa có kết quả. Mở Tự luận để bắt đầu ghi nhận tiến độ của bài.</p>
      : !difficult.length ? <p className="study-report-empty">Chưa có từ trả lời sai. Tiếp tục học để hoàn thành bài!</p>
      : <><h3>Từ sai nhiều nhất</h3><ol className="study-report-words">{difficult.map(({ card, progress }) => <li key={card.id}>
        <div><strong lang="ja">{card.japanese || card.reading}</strong><p lang="ja">{card.reading}</p><p className="vocab-hint">{card.meaning}</p></div>
        <div className="study-report-word-status"><strong className="vocab-error">{progress.wrongCount} lần sai</strong><span className={progress.lastOutcome === 'correct' ? 'vocab-correct' : 'vocab-hint'}>{progress.lastOutcome === 'correct' ? 'Đã thuộc' : 'Cần ôn lại'}</span></div>
      </li>)}</ol>
      {report.difficult.length > 5 && <button className="btn-secondary" onClick={() => setShowAll(!showAll)}>{showAll ? 'Thu gọn' : `Xem tất cả ${report.difficult.length} từ từng sai`}</button>}</>}
  </section>;
}
