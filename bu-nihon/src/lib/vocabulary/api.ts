import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CardInput, Folder, FolderDetail, SetDetail, StudySet } from './schemas';

const base = '/vocabulary';
const cardBody = ({ meaning, reading, japanese }: CardInput) => ({ meaning, reading, japanese });
export const vocabularyApi = {
  folders: () => api.get<Folder[]>(`${base}/folders`),
  folder: (id: string) => api.get<FolderDetail>(`${base}/folders/${id}`),
  set: (id: string) => api.get<SetDetail>(`${base}/sets/${id}`),
  createFolder: (name: string) => api.post<Folder>(`${base}/folders`, { name }),
  renameFolder: (id: string, name: string) => api.patch(`${base}/folders/${id}`, { name }),
  deleteFolder: (folder: Folder) => api.delete(`${base}/folders/${folder.id}`, { expectedSetCount: folder.setCount, expectedCardCount: folder.cardCount }),
  createSet: (id: string, name: string) => api.post<StudySet>(`${base}/folders/${id}/sets`, { name }),
  renameSet: (id: string, name: string) => api.patch(`${base}/sets/${id}`, { name }),
  deleteSet: (set: StudySet) => api.delete(`${base}/sets/${set.id}`, { expectedSetCount: 1, expectedCardCount: set.cardCount }),
  createCard: (id: string, card: CardInput) => api.post(`${base}/sets/${id}/cards`, cardBody(card)),
  importCards: (id: string, cards: CardInput[]) => api.post<{ imported: number; skipped: number }>(`${base}/sets/${id}/import`, { cards: cards.map(cardBody) }),
  updateCard: (id: string, card: CardInput) => api.patch(`${base}/cards/${id}`, cardBody(card)),
  deleteCard: (id: string) => api.delete(`${base}/cards/${id}`),
};

export function useVocabularyData(userId: string, folderId?: string, setId?: string) {
  const key = ['vocabulary', userId];
  const folders = useQuery({ queryKey: [...key, 'folders'], queryFn: vocabularyApi.folders, enabled: !folderId && !setId, retry: false });
  const folder = useQuery({ queryKey: [...key, 'folder', folderId], queryFn: () => vocabularyApi.folder(folderId!), enabled: Boolean(folderId), retry: false });
  const set = useQuery({ queryKey: [...key, 'set', setId], queryFn: () => vocabularyApi.set(setId!), enabled: Boolean(setId), retry: false });
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (action: () => Promise<unknown>) => action(),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  return { folders, folder, set, mutation };
}
