# Vocabulary HTTP contract

Base /api/vocabulary. Cookie JWT required everywhere. Responses private/no-store.
All ids UUID; invalid 400; unknown/foreign 404; validation 400; stale delete counts 409.
Return JSON; deletes return {deleted:true}. Every list ordered createdAt,id ASC.

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| GET | /folders | — | FolderSummary[] |
| POST | /folders | {name} | FolderSummary |
| GET | /folders/:id | — | FolderSummary + sets:SetSummary[] |
| PATCH | /folders/:id | {name} | FolderSummary |
| DELETE | /folders/:id | {expectedSetCount,expectedCardCount} | deleted |
| POST | /folders/:id/sets | {name} | SetSummary |
| GET | /sets/:id | — | SetSummary + cards:Card[] |
| PATCH | /sets/:id | {name} | SetSummary |
| DELETE | /sets/:id | {expectedSetCount:1,expectedCardCount} | deleted |
| POST | /sets/:id/cards | {meaning,reading,japanese?} | Card |
| PATCH | /cards/:id | {meaning,reading,japanese?} | Card |
| DELETE | /cards/:id | — | deleted |

FolderSummary={id,name,setCount,cardCount}; SetSummary={id,folderId,name,cardCount};
Card={id,setId,meaning,reading,japanese,createdAt,updatedAt}. Ownership derived via folder.
Counts are numbers. No accepted ownerId or parent changes in update bodies.
UI routes /vocabulary, /vocabulary/folders/:id, /vocabulary/sets/:id,
/vocabulary/sets/:id/flashcard and /vocabulary/sets/:id/written.
Validation limits in data-model.md. UI form pending prevents double click; successful mutations
invalidate user-specific vocabulary queries. Deletion counts refreshed/checked in transaction.