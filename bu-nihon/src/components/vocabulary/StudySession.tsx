"use client";
import Link from 'next/link';
import { useRef, useState } from 'react';
import type { Card, SetDetail } from '@/lib/vocabulary/schemas';
import { isCorrect, normalizeAnswer, summarize } from '@/lib/vocabulary/study';
import { finalizeKana } from '@/lib/vocabulary/kana';
import { KanaInput } from './KanaInput';

export function StudySession({ set, mode }: { set: SetDetail; mode: 'flashcard' | 'written' }) {
  const [cards, setCards] = useState<Card[]>(() => set.cards.map(card => ({ ...card })));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [results, setResults] = useState<boolean[]>([]);
  const [graded, setGraded] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState('');
  const gradedLock = useRef(false);
  const card = cards[index];
  const check = () => {
    if (gradedLock.current || !card) return;
    if (!normalizeAnswer(answer)) { setError('Vui lòng nhập câu trả lời.'); return; }
    gradedLock.current = true;
    const correct = isCorrect(answer, card.reading);
    setAnswer(finalizeKana(answer)); setGraded(correct); setResults(old => [...old, correct]); setError('');
  };
  const next = () => {
    if (!gradedLock.current) return;
    if (index === cards.length - 1) { setFinished(true); return; }
    gradedLock.current = false; setIndex(index + 1); setGraded(null); setAnswer(''); setError('');
  };
  const wrong = cards.filter((_, i) => results[i] === false);
  const retry = () => {
    if (!wrong.length) return;
    setCards(wrong); setResults([]); setIndex(0); setAnswer(''); setGraded(null);
    gradedLock.current = false; setFinished(false); setError('');
  };
  return <section className="vocab-study">
    <Link href={`/vocabulary/sets/${set.id}`} className="vocab-back">← Về bộ {set.name}</Link>
    <h1>{mode === 'flashcard' ? 'Flashcard' : 'Tự luận'}</h1>
    {!cards.length ? <div className="card vocab-empty"><h2>Bộ chưa có thẻ</h2><p>Thêm thẻ để bắt đầu học.</p></div>
      : finished ? <div className="card vocab-panel">
        <h2>Kết quả lượt học</h2>
        <p>Tổng {summarize(results).total} · Đúng {summarize(results).correct} · Sai {summarize(results).wrong}</p>
        <p className="vocab-score">{summarize(results).percentage}%</p>
        {wrong.length ? <><h3>Câu cần ôn lại</h3><ul>{wrong.map(item => <li key={item.id}>{item.meaning} — <span lang="ja">{item.reading}</span></li>)}</ul></> : <p>Bạn đã trả lời đúng tất cả câu hỏi!</p>}
        <button className="btn-primary" disabled={!wrong.length} onClick={retry}>Làm lại câu sai</button>
      </div> : <>
        <p aria-label="Tiến độ">{index + 1}/{cards.length}</p>
        {mode === 'flashcard' ? <>
          <button className="card vocab-flashcard" onClick={() => setFlipped(!flipped)} aria-label={flipped ? 'Lật về nghĩa tiếng Việt' : 'Lật xem đáp án'}>
            <span className="vocab-eyebrow">{flipped ? 'Cách đọc · Chữ Nhật' : 'Nghĩa tiếng Việt'}</span>
            <span className="vocab-flash-text" lang={flipped ? 'ja' : 'vi'}>{flipped ? card.reading : card.meaning}</span>
            {flipped && card.japanese && <span className="vocab-japanese" lang="ja">{card.japanese}</span>}
            <span className="vocab-hint">Chạm hoặc nhấn Enter để lật</span>
          </button>
          <div className="vocab-actions"><button className="btn-secondary" disabled={index === 0} onClick={() => { setIndex(index - 1); setFlipped(false); }}>← Trước</button>
            <button className="btn-primary" disabled={index === cards.length - 1} onClick={() => { setIndex(index + 1); setFlipped(false); }}>Sau →</button></div>
        </> : <div className="card vocab-panel">
          <p className="vocab-eyebrow">Nhập cách đọc bằng hiragana</p><h2 className="vocab-question">{card.meaning}</h2>
          <p className="vocab-hint">Dùng bàn phím tiếng Anh. Romaji tự chuyển khi bạn gõ.</p>
          <KanaInput key={index} value={answer} onChange={setAnswer} onCheck={check} disabled={graded !== null} />
          {error && <p role="alert" className="vocab-error">{error}</p>}
          <div aria-live="polite">{graded !== null && <p className={graded ? 'vocab-correct' : 'vocab-error'}>{graded ? 'Đúng!' : 'Chưa đúng.'} Đáp án: <span lang="ja">{card.reading}</span></p>}</div>
          <div className="vocab-actions"><button className="btn-primary" disabled={graded !== null} onClick={check}>Kiểm tra</button>
            {graded !== null && <button className="btn-secondary" onClick={next}>{index === cards.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}</button>}</div>
        </div>}
      </>}
  </section>;
}
