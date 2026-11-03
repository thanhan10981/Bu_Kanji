import { n3ImageRows } from '../../data/n3-image-vocabulary.ts';
import type { Card, SetDetail } from './schemas.ts';

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
export function getLibrarySet(id: string) { return id === libraryReview.id ? libraryReview : librarySets.find(set => set.id === id); }
