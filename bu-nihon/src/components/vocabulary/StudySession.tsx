"use client";
import Link from 'next/link';
import { useRef, useState, useSyncExternalStore } from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import type { Card, SetDetail } from '@/lib/vocabulary/schemas';
import { advanceWritten, gradeWritten, matchesCard, normalizeAnswer, startShuffledWritten, startWritten, summarize } from '@/lib/vocabulary/study';
import { finalizeKana } from '@/lib/vocabulary/kana';
import { KanaInput } from './KanaInput';
import { useStudyProgress } from '@/lib/vocabulary/progress-store';

interface StudySessionProps { set: SetDetail; mode: 'flashcard' | 'written' }
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function StudySession(props: StudySessionProps) {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  // Start random ordering only in the browser, avoiding server/client question mismatches.
  if (props.mode === 'written' && !hydrated) return <p role="status">Đang xáo trộn câu hỏi…</p>;
  return <StudySessionContent {...props} />;
}

function StudySessionContent({ set, mode }: StudySessionProps) {
  const studyProgress = useStudyProgress();
  const [cards, setCards] = useState<Card[]>(() => set.cards.map(card => ({ ...card })));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [session, setSession] = useState(() => mode === 'written' ? startShuffledWritten(set.cards.length) : startWritten(set.cards.length));
  const [prompt, setPrompt] = useState<'japanese' | 'meaning'>('japanese');
  const [error, setError] = useState('');
  const [inputKey, setInputKey] = useState(0);
  const lock = useRef(false);
  const card = cards[mode === 'flashcard' ? index : session.queue[0]];
  const back = `/vocabulary/sets/${set.id}`;
  const feedback = session.feedback;
  const ready = feedback === 'correct' || feedback === 'corrected';
  const finished = session.queue.length === 0;
  const wrong = session.missed.map(i => cards[i]);
  const score = summarize(session.results.filter((result): result is boolean => result !== null));
  const next = () => {
    if (!ready) return;
    setSession(advanceWritten(session)); setAnswer(''); setError(''); setInputKey(key => key + 1);
    lock.current = false;
  };
  const check = () => {
    if (ready) { next(); return; }
    if (lock.current || !card) return;
    if (!normalizeAnswer(answer)) { setError('Vui lòng nhập câu trả lời.'); return; }
    lock.current = true;
    const correct = matchesCard(finalizeKana(answer), card);
    studyProgress.record(card, correct ? session.needsCorrection ? 'corrected' : 'correct' : 'wrong');
    setSession(gradeWritten(session, correct)); setError('');
    if (correct) setAnswer(card.japanese || card.reading);
    else { setAnswer(''); setInputKey(key => key + 1); }
    lock.current = false;
  };
  const restart = (items: Card[]) => {
    setCards(items); setSession(startShuffledWritten(items.length)); setAnswer(''); setError('');
    setInputKey(key => key + 1); lock.current = false;
  };
  if (!cards.length) return <section className="vocab-study"><Link href={back} className="vocab-back">← Về bộ {set.name}</Link><div className="card vocab-empty"><h2>Bộ chưa có thẻ</h2><p>Thêm thẻ để bắt đầu học.</p></div></section>;
  if (mode === 'flashcard') return <section className="vocab-study">
    <Link href={back} className="vocab-back">← Về bộ {set.name}</Link><h1>Flashcard</h1>
    <p aria-label="Tiến độ">{index + 1}/{cards.length}</p>
    <button className="card vocab-flashcard" onClick={() => setFlipped(!flipped)} aria-label={flipped ? 'Lật về chữ Nhật' : 'Lật xem đáp án'}>
      <span className="vocab-eyebrow">{flipped ? 'Cách đọc · Nghĩa tiếng Việt' : 'Chữ Nhật'}</span>
      <span className="vocab-flash-text" lang="ja">{flipped ? card.reading : card.japanese || card.reading}</span>
      {flipped && <span className="vocab-flash-meaning" lang="vi">{card.meaning}</span>}
      {flipped && card.hanViet && <span className="vocab-hint">{card.hanViet}</span>}
      <span className="vocab-hint">Chạm hoặc nhấn Enter để lật</span>
    </button>
    <div className="vocab-actions"><button className="btn-secondary" disabled={index === 0} onClick={() => { setIndex(index - 1); setFlipped(false); }}>← Trước</button>
      <button className="btn-primary" disabled={index === cards.length - 1} onClick={() => { setIndex(index + 1); setFlipped(false); }}>Sau →</button></div>
  </section>;
  return <section className="written-stage" aria-label={`Tự luận — ${set.name}`}>
    <div className="written-card">
      <header className="written-top"><span className="written-count" aria-label="Số từ đã thuộc">{session.completed.length} / {cards.length}</span>
        <progress max={cards.length} value={session.completed.length} aria-label="Tiến độ học" />
        <Link className="written-close" href={back} aria-label="Thoát tự luận"><X size={22} /></Link></header>
      {finished ? <div className="written-results">
        <Check size={44} /><h1>Hoàn thành lượt học!</h1><p>Bạn đã nhớ lại đúng {cards.length}/{cards.length} từ.</p>
        <p>Lần trả lời đầu: {score.correct} đúng · {score.wrong} sai · {score.percentage}%</p>
        <p>{wrong.length} từ từng sai đã được sửa và ôn lại cuối lượt.</p>
        <div className="vocab-actions"><button className="btn-primary" disabled={!wrong.length} onClick={() => restart(wrong)}><RotateCcw size={17} /> Làm lại câu sai</button>
          <button className="btn-secondary" onClick={() => restart(set.cards)}>Học lại tất cả</button><Link className="btn-secondary" href={back}>Về bài học</Link></div>
      </div> : <>
        <div className="written-settings"><span>{set.name} · Tự luận</span><label>Câu hỏi <select aria-label="Kiểu câu hỏi" value={prompt} onChange={event => setPrompt(event.target.value as 'japanese' | 'meaning')}>
          <option value="japanese">Chữ Nhật → cách đọc</option><option value="meaning">Nghĩa Việt → chữ Nhật</option></select></label></div>
        <div className="written-prompt"><h1 lang={prompt === 'japanese' ? 'ja' : 'vi'}>{prompt === 'japanese' ? card.japanese || card.meaning : card.meaning}</h1>
          {ready && <p className="written-meaning">{card.meaning}{card.hanViet ? ` · ${card.hanViet}` : ''}</p>}</div>
        <div className={`written-input ${ready ? 'is-correct' : feedback === 'wrong' ? 'is-wrong' : ''}`}>
          <KanaInput key={inputKey} value={answer} onChange={setAnswer} onCheck={check} readOnly={ready} />
        </div>
        <div className="written-feedback" aria-live="polite">
          {studyProgress.error && <p role="alert" className="vocab-error">{studyProgress.error}</p>}
          {error && <p role="alert" className="vocab-error">{error}</p>}
          {feedback === 'wrong' && <><strong className="vocab-error">Chưa đúng. Nhập lại đáp án để tiếp tục.</strong><p lang="ja">{card.reading} — {card.japanese}</p><p>{card.meaning}</p></>}
          {feedback === 'correct' && <><strong className="vocab-correct">Chính xác!</strong><p lang="ja">{card.reading}</p></>}
          {feedback === 'corrected' && <><strong className="vocab-correct">Đã sửa đúng.</strong><p>Từ này chưa tính đã thuộc, sẽ xuất hiện lại cuối lượt.</p></>}
          {!feedback && <p>Gõ romaji để chuyển ngay sang hiragana. Cũng chấp nhận cách viết tiếng Nhật của từ.</p>}
          {!feedback && card.readingNote && <p>{card.readingNote}</p>}
        </div>
        <button className="written-submit" onClick={check}>{ready ? 'Enter hoặc bấm để tiếp tục →' : feedback === 'wrong' ? 'Kiểm tra lại' : 'Nhấn Enter để kiểm tra'}</button>
      </>}
    </div>
  </section>;
}
