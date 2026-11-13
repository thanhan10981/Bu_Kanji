"use client";
import Link from 'next/link';
import { useState } from 'react';
import { BarChart3, Layers } from 'lucide-react';
import type { SetDetail } from '@/lib/vocabulary/schemas';
import { flashKey, flashRevision, flashSummary } from '@/lib/vocabulary/flashcard';
import { useFlashProgress } from '@/lib/vocabulary/flashcard-store';
import './flashcard.css';

export function FlashcardReport({ set }: { set: SetDetail }) {
  const { data, scope, ready, error, authError } = useFlashProgress();
  const [showAll, setShowAll] = useState(false);
  if (authError) return <p role="alert" className="vocab-error">Chưa xác định được tài khoản để tải báo cáo Flashcard. Vui lòng tải lại trang.</p>;
  if (!ready) return <p role="status">Đang tải báo cáo Flashcard…</p>;
  const report = flashSummary(data, scope, set.cards);
  const key = flashKey(scope, set.id);
  const session = data.sessions[key];
  const resumable = session && session.finishedAt === null && session.revision === flashRevision(set.cards);
  const history = data.history[key] ?? [];
  return <section id="flashcard-report" className="card study-report flash-report" aria-label={`Báo cáo Flashcard ${set.name}`}>
    <header className="study-report-heading"><div><h2><BarChart3 size={23} /> Báo cáo Flashcard</h2><p className="vocab-hint">Lưu trên trình duyệt này · {scope === 'guest' ? 'Khách' : 'Tài khoản hiện tại'}</p></div>
      <strong className="study-report-percent">{report.percentage}% <small>đã học</small></strong></header>
    <progress aria-label="Tỷ lệ thẻ đã học" max={set.cards.length || 1} value={report.studied} />
    <div className="study-report-metrics">
      <div><strong>{report.studied}/{set.cards.length}</strong><span>Thẻ đã học</span></div>
      <div><strong>{report.remembered}</strong><span>Tự đánh giá đã nhớ</span></div>
      <div><strong>{report.review.length}</strong><span>Thẻ cần ôn</span></div>
      <div><strong>{report.unseen}</strong><span>Thẻ chưa học</span></div>
    </div>
    <p className="vocab-hint flash-caption">Tiến độ dựa trên lựa chọn sau khi lật thẻ. Chỉ lật thẻ chưa được tính là đã học. {report.reviews} lần đánh giá đã ghi nhận. Dữ liệu không đồng bộ sang thiết bị khác.</p>
    {error && <p role="alert" className="vocab-error">{error}</p>}
    {set.cards.length > 0 && <Link className="btn-primary" href={`/vocabulary/sets/${set.id}/flashcard`}><Layers size={18} /> {resumable ? `Tiếp tục lượt học · ${session.results.length}/${session.order.length}` : 'Học Flashcard'}</Link>}
    {report.review.length > 0 && <><h3>Những thẻ cần ôn lại</h3><ul className="study-report-words">{(showAll ? report.review : report.review.slice(0, 5)).map(card => <li key={card.id}><div><strong lang="ja">{card.japanese || card.reading}</strong><p>{card.reading} · {card.meaning}</p></div></li>)}</ul>
      {report.review.length > 5 && <button className="btn-secondary" onClick={() => setShowAll(!showAll)}>{showAll ? 'Thu gọn' : `Xem ${report.review.length} thẻ cần ôn`}</button>}</>}
    {!report.studied && <p className="study-report-empty">Chưa có tiến độ. Mở Flashcard, lật thẻ và tự đánh giá để bắt đầu.</p>}
    {history.length > 0 && <div className="flash-history"><h3>Lượt học gần đây</h3><ol>{history.map(item => <li key={item.id}><time dateTime={new Date(item.finishedAt).toISOString()}>{new Date(item.finishedAt).toLocaleString('vi-VN')}</time><span>{item.remembered}/{item.total} đã nhớ · {item.total - item.remembered} cần ôn</span></li>)}</ol><p className="vocab-hint">Lưu tối đa 10 lượt hoàn thành của bộ này. Lịch sử giữ kết quả tại thời điểm học.</p></div>}
  </section>;
}
