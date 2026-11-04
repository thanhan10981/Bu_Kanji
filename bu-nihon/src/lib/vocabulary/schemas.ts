import { z } from 'zod';

export const nameSchema = z.object({ name: z.string().trim().min(1, 'Vui lòng nhập tên.').max(120, 'Tên tối đa 120 ký tự.') });
export const cardSchema = z.object({
  meaning: z.string().trim().min(1, 'Vui lòng nhập nghĩa tiếng Việt.').max(500, 'Nghĩa tối đa 500 ký tự.'),
  reading: z.string().transform(s => s.normalize('NFC').replace(/\s/gu, '')).pipe(z.string().min(1, 'Vui lòng nhập cách đọc.').max(200, 'Cách đọc tối đa 200 ký tự.').regex(/^[\u3041-\u3096ー]+$/u, 'Cách đọc chỉ gồm hiragana và dấu ー.')),
  japanese: z.string().trim().max(200, 'Chữ Nhật tối đa 200 ký tự.').default(''),
});
export type CardInput = z.infer<typeof cardSchema>;
export interface Folder { id: string; name: string; setCount: number; cardCount: number }
export interface StudySet { id: string; folderId: string; name: string; cardCount: number }
export interface Card extends CardInput {
  id: string; setId: string; createdAt: string; updatedAt: string; hanViet?: string;
  acceptedReadings?: string[]; readingNote?: string; sourcePage?: number;
}
export interface FolderDetail extends Folder { sets: StudySet[] }
export interface SetDetail extends StudySet { cards: Card[] }
