"use client";
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Check, Layers, RotateCcw, RotateCw, Shuffle, Trophy } from 'lucide-react';
import type { Card, SetDetail } from '@/lib/vocabulary/schemas';
import { flashKey, flashRevision, flashSummary, type FlashFilter } from '@/lib/vocabulary/flashcard';
import { useFlashProgress } from '@/lib/vocabulary/flashcard-store';
import './flashcard.css';

function LearningCard({ card, reverse, onRate }: { card: Card; reverse: boolean; onRate: (remembered: boolean) => void }) {
  const [flipped, setFlipped] = useState(false);
  return <>
    <button className={`card vocab-flashcard flash-learning-card ${flipped ? 'is-revealed' : ''}`} onClick={() => setFlipped(!flipped)} aria-label={flipped ? 'Lật về câu hỏi' : 'Lật xem đáp án'} aria-pressed={flipped}>
      <span className="vocab-eyebrow">{flipped ? 'ĐÁP ÁN' : reverse ? 'NGHĨA TIẾNG VIỆT' : 'CHỮ NHẬT'}</span>
      {!flipped ? <span className={`vocab-flash-text ${reverse ? 'flash-vietnamese' : ''}`} lang={reverse ? 'vi' : 'ja'}>{reverse ? card.meaning : card.japanese || card.reading}</span>
        : <><span className="vocab-flash-text" lang="ja">{card.japanese || card.reading}</span><span className="flash-reading" lang="ja">{card.reading}</span><span className="vocab-flash-meaning">{card.meaning}</span>{card.hanViet && <span className="vocab-hint">Hán Việt: {card.hanViet}</span>}{card.readingNote && <span className="vocab-hint">{card.readingNote}</span>}</>}
      <span className="flash-flip-hint"><RotateCw size={16} /> Chạm hoặc nhấn Enter / Space để lật</span>
    </button>
    <p className="vocab-hint flash-instruction" aria-live="polite">{flipped ? 'Bạn có nhớ được từ này trước khi lật thẻ không?' : 'Thử nhớ câu trả lời, sau đó lật thẻ để kiểm tra.'}</p>
    <div className="flash-rating"><button className="btn-secondary" disabled={!flipped} onClick={() => onRate(false)}><RotateCcw size={19} /> Cần ôn</button><button className="btn-primary" disabled={!flipped} onClick={() => onRate(true)}><Check size={19} /> Đã nhớ</button></div>
  </>;
}

export function FlashcardSession({ set }: { set: SetDetail }) {
  const { data, scope, ready, error, authError, start, rate } = useFlashProgress();
  const [filter, setFilter] = useState<FlashFilter>('all');
  const [reverse, setReverse] = useState(false);
  const back = `/vocabulary/sets/${set.id}`;
  if (authError) return <p role="alert" className="vocab-error">Chưa xác định được tài khoản để lưu lượt học. Vui lòng tải lại trang.</p>;
  if (!ready) return <p role="status">Đang tải tiến độ Flashcard…</p>;
  const report = flashSummary(data, scope, set.cards);
  const stored = data.sessions[flashKey(scope, set.id)];
  const session = stored?.revision === flashRevision(set.cards) ? stored : undefined;
  const currentId = session?.order[session.results.length];
  const card = set.cards.find(card => card.id === currentId);
  const count = filter === 'review' ? report.review.length : filter === 'unseen' ? report.unseen : set.cards.length;
  const finished = session?.finishedAt !== null && session?.finishedAt !== undefined;
  const begin = (selected: FlashFilter, direction = reverse) => start(scope, set, selected, direction);
  return <section className="vocab-study flash-stage" aria-label={`Học Flashcard ${set.name}`}>
    <Link href={back} className="vocab-back flash-back"><ArrowLeft size={18} /> Về bộ từ vựng</Link>
    <header className="flash-heading"><span className="vocab-eyebrow"><Layers size={16} /> HỌC FLASHCARD</span><h1>{set.name}</h1><p className="vocab-hint">Lật thẻ, ghi nhớ từng từ, theo dõi sự tiến bộ của bạn.</p></header>
    {error && <p role="alert" className="vocab-error">{error}</p>}
    {!set.cards.length ? <div className="card vocab-empty"><Layers size={36} /><h2>Bộ chưa có thẻ</h2><p>Thêm từ vựng vào bộ để bắt đầu học.</p></div>
      : !session ? <div className="card flash-setup">
        <Shuffle size={32} /><h2>Sẵn sàng cho một lượt học?</h2><p className="vocab-hint">Thẻ được xáo trộn mỗi lượt. Tiến độ tự lưu sau mỗi lần đánh giá.</p>
        {stored && <p role="status" className="vocab-hint">Nội dung bộ thẻ đã thay đổi. Bắt đầu lượt mới; tiến độ của các thẻ không đổi vẫn được giữ.</p>}
        <div className="flash-settings"><label>Thẻ muốn học<select value={filter} onChange={event => setFilter(event.target.value as FlashFilter)}><option value="all">Tất cả · {set.cards.length} thẻ</option><option value="review">Cần ôn · {report.review.length} thẻ</option><option value="unseen">Chưa học · {report.unseen} thẻ</option></select></label>
          <label>Mặt trước<select value={reverse ? 'meaning' : 'japanese'} onChange={event => setReverse(event.target.value === 'meaning')}><option value="japanese">Chữ Nhật → nghĩa Việt</option><option value="meaning">Nghĩa Việt → chữ Nhật</option></select></label></div>
        {!count && <p role="status">Không có thẻ phù hợp. Hãy chọn nhóm khác.</p>}
        <button className="btn-primary" disabled={!count} onClick={() => begin(filter)}>Bắt đầu học · {count} thẻ</button>
      </div> : finished ? <div className="card flash-results" aria-live="polite"><Trophy size={44} /><span className="vocab-eyebrow">HOÀN THÀNH LƯỢT HỌC</span><h2>Bạn đã học {session.order.length} thẻ!</h2><div className="flash-result-counts"><div><strong>{session.results.filter(Boolean).length}</strong><span>Đã nhớ</span></div><div><strong>{session.results.filter(value => !value).length}</strong><span>Cần ôn</span></div></div>
        <p className="vocab-hint">Kết quả tự đánh giá đã được ghi nhận trong báo cáo Flashcard.</p>
        <div className="vocab-actions"><button className="btn-primary" disabled={!report.review.length} onClick={() => begin('review', session.reverse)}><RotateCcw size={18} /> Ôn {report.review.length} thẻ cần ôn</button><button className="btn-secondary" onClick={() => begin('all', !session.reverse)}>Đảo chiều và học lại</button><button className="btn-secondary" onClick={() => begin('all', session.reverse)}>Học lại tất cả</button><Link className="btn-secondary" href={`${back}#flashcard-report`}>Xem báo cáo tiến độ</Link></div>
      </div> : card ? <>
        <div className="flash-progress"><div><strong>{session.results.length}/{session.order.length} thẻ đã học</strong><span>{session.results.filter(Boolean).length} đã nhớ · {session.results.filter(value => !value).length} cần ôn</span></div><progress aria-label="Tiến độ lượt Flashcard" value={session.results.length} max={session.order.length} /></div>
        <LearningCard key={`${scope}:${session.id}:${card.id}`} card={card} reverse={session.reverse} onRate={remembered => rate(scope, set, session.id, card.id, remembered)} />
        <p className="vocab-hint flash-save-note">Lượt đang học được lưu trên trình duyệt này. Bạn có thể thoát và quay lại để tiếp tục.</p>
      </> : <p role="alert">Không tìm thấy thẻ đang học. Vui lòng tải lại trang.</p>}
  </section>;
}
