import { n3ImageRows } from '../../data/n3-image-vocabulary.ts';
import type { Card, SetDetail } from './schemas.ts';
import quizletData from '../../data/quizlet-de-7-2026.json' with { type: 'json' };

export const libraryInfo = {
  title: 'MIMIKARA N3',
  description: 'Từ vựng từ các bảng ảnh bạn cung cấp',
  source: 'Bảng ảnh Sách Nhật Ngữ do người dùng cung cấp. Chia bài theo thứ tự ảnh, không khẳng định trùng cách chia của giáo trình.',
};
function toHiragana(value: string) {
  return value.replace(/[ァ-ヶ]/gu, char => String.fromCharCode(char.charCodeAt(0) - 0x60));
}
export const libraryCards: Card[] = n3ImageRows.trim().split('\n').map((line, index) => {
  const [japanese, reading, meaning, hanViet = ''] = line.split('|');
  return { id: `n3-image-${index + 1}`, setId: `n3-lesson-${Math.floor(index / 60) + 1}`,
    japanese, reading: reading || toHiragana(japanese), meaning, hanViet,
    createdAt: '', updatedAt: '' };
});
export const librarySets: SetDetail[] = Array.from({ length: Math.ceil(libraryCards.length / 60) }, (_, i) => {
  const cards = libraryCards.slice(i * 60, (i + 1) * 60);
  return { id: `n3-lesson-${i + 1}`, folderId: 'n3-library', name: `Bài ${i + 1}`,
    cardCount: cards.length, cards };
});
export const libraryReview: SetDetail = { id: 'n3-review', folderId: 'n3-library', name: 'Tổng ôn N3',
  cardCount: libraryCards.length, cards: libraryCards };
export const quizletCards: Card[] = quizletData.cards.map((card, index) => ({
  ...card, id: `quizlet-2026-07-${index + 1}`, setId: `quizlet-2026-07-lesson-${Math.floor(index / 60) + 1}`,
  createdAt: '', updatedAt: '',
}));
export const quizletSets: SetDetail[] = Array.from({ length: Math.ceil(quizletCards.length / 60) }, (_, i) => ({
  id: `quizlet-2026-07-lesson-${i + 1}`, folderId: 'quizlet-2026-07', name: `Đề 7/2026 – Bài ${i + 1}`,
  cards: quizletCards.slice(i * 60, (i + 1) * 60), cardCount: Math.min(60, quizletCards.length - i * 60),
}));
export const quizletReview: SetDetail = { id: 'quizlet-2026-07-review', folderId: 'quizlet-2026-07',
  name: 'Tổng ôn Đề 7/2026 – 30/10', cards: quizletCards, cardCount: quizletCards.length };

export const libraryCollections = [
  { id: 'n3-library', ...libraryInfo, href: '/vocabulary/library', badge: 'N3', cards: libraryCards, sets: librarySets, review: libraryReview },
  { id: 'quizlet-2026-07', title: quizletData.title, description: 'Bộ thẻ Quizlet từ PDF của bạn',
    source: '707 thẻ từ 36 trang PDF Quizlet, giữ thứ tự và nội dung gốc, gồm từ vựng, cụm từ và mẫu ngữ pháp. Mỗi bài tối đa 60 thẻ.',
    href: '/vocabulary/library/quizlet-2026-07', badge: 'ĐỀ 7', cards: quizletCards, sets: quizletSets, review: quizletReview },
];
export function getLibraryCollection(setId?: string) {
  return libraryCollections.find(collection => collection.review.id === setId || collection.sets.some(set => set.id === setId)) ?? libraryCollections[0];
}
export function getLibrarySet(id: string) {
  for (const collection of libraryCollections) {
    if (collection.review.id === id) return collection.review;
    const set = collection.sets.find(set => set.id === id);
    if (set) return set;
  }
}
