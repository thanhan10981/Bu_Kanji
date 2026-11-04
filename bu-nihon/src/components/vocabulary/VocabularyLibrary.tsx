"use client";
import Link from 'next/link';
import { useState } from 'react';
import { BookOpen, Layers, List, PencilLine, Search } from 'lucide-react';
import { getLibraryCollection, libraryCollections } from '@/lib/vocabulary/library';
import type { SetDetail } from '@/lib/vocabulary/schemas';
import { StudySession } from './StudySession';
import { StudyReport } from './StudyReport';
import './vocabulary.css';

export function LibraryEntry() {
  return <section className="vocab-root library-home"><header className="library-title"><h1>TỪ VỰNG CÓ SẴN</h1><p>Chọn bộ từ vựng để học ngay</p></header>
    <div className="library-books">{libraryCollections.map(collection => <Link key={collection.id} href={collection.href} className="library-book"><div className="library-book-icon"><BookOpen size={48} /><span>{collection.badge}</span></div>
      <div><h2>{collection.title}</h2><p>{collection.description}</p><strong>{collection.sets.length} bài · {collection.cards.length} thẻ</strong></div><span className="library-arrow">→</span></Link>)}</div>
    <p className="vocab-hint library-note">Danh sách có sẵn · Flashcard · Tự luận. Các bộ cá nhân của bạn ở bên dưới.</p>
  </section>;
}

export function VocabularyLibrary({ set, mode, collectionId }: { set?: SetDetail; mode?: 'flashcard' | 'written'; collectionId?: string }) {
  const [view, setView] = useState<'menu' | 'list'>('menu');
  const [search, setSearch] = useState('');
  const collection = collectionId ? libraryCollections.find(item => item.id === collectionId) ?? libraryCollections[0] : getLibraryCollection(set?.id);
  const { cards: libraryCards, sets: librarySets, review: libraryReview } = collection;
  const libraryInfo = collection;
  if (set && mode) return <div className="vocab-root"><StudySession key={`${set.id}:${mode}`} set={set} mode={mode} /></div>;
  if (!set) return <div className="vocab-root library-page"><Link href="/vocabulary" className="vocab-back">← Từ vựng</Link>
    <header className="library-title"><h1>{libraryInfo.title}</h1><p>{librarySets.length} bài · {libraryCards.length} mục từ</p></header>
    <div className="library-lessons">{librarySets.map((lesson, i) => <Link href={`/vocabulary/sets/${lesson.id}`} className="library-lesson" key={lesson.id}>
      <span>BÀI</span><strong>{i + 1}</strong><small>{lesson.cardCount} từ vựng</small></Link>)}
      <Link href={`/vocabulary/sets/${libraryReview.id}`} className="library-lesson library-review"><Layers size={28} /><strong>TỔNG ÔN</strong><small>{libraryCards.length} từ vựng</small></Link></div>
    <p className="vocab-hint library-note">{libraryInfo.source}</p>
  </div>;
  const filtered = set.cards.filter(card => `${card.japanese} ${card.reading} ${card.meaning} ${card.hanViet ?? ''}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
  return <div className="vocab-root library-page"><Link href={collection.href} className="vocab-back">← {libraryInfo.title}</Link>
    <header className="library-title"><h1>{set.name.toLocaleUpperCase('vi')}</h1><p className="library-course">TỪ VỰNG {libraryInfo.title}</p><p>{set.cardCount} mục từ</p></header>
    <nav className="library-modes" aria-label="Chọn cách học">
      <button className={view === 'list' ? 'is-active' : ''} onClick={() => setView(view === 'list' ? 'menu' : 'list')}><List size={34} /><strong>DANH SÁCH</strong></button>
      <Link href={`/vocabulary/sets/${set.id}/flashcard`}><Layers size={34} /><strong>FLASHCARD</strong></Link>
      <Link href={`/vocabulary/sets/${set.id}/written`}><PencilLine size={34} /><strong>TỰ LUẬN</strong></Link>
    </nav>
    <StudyReport key={set.id} set={set} />
    {view === 'list' && <section className="library-list"><label className="library-search"><Search size={20} /><input className="input-base" aria-label="Tìm từ trong bài" placeholder="Tìm chữ Nhật, cách đọc, nghĩa…" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <div className="library-table-wrap"><table><thead><tr><th>#</th><th>Chữ Nhật</th><th>Hán Việt</th><th>Cách đọc</th><th>Nghĩa</th></tr></thead><tbody>{filtered.map(card => <tr key={card.id}>
        <td>{set.cards.indexOf(card) + 1}</td><td lang="ja">{card.japanese}</td><td>{card.hanViet || '—'}</td><td><span lang="ja">{card.reading}</span>{card.readingNote && <p className="vocab-hint">{card.readingNote}</p>}</td><td>{card.meaning}</td></tr>)}</tbody></table></div>
      {!filtered.length && <p className="vocab-empty">Không tìm thấy từ phù hợp.</p>}
    </section>}
  </div>;
}
