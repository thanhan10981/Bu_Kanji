import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CardDto, DeleteDto } from './vocabulary.dto';

const folderSelect = `SELECT f.id,f.name,
 (SELECT count(*)::int FROM vocab_sets s WHERE s."folderId"=f.id) AS "setCount",
 (SELECT count(*)::int FROM vocab_cards c JOIN vocab_sets s ON s.id=c."setId" WHERE s."folderId"=f.id) AS "cardCount"
 FROM vocab_folders f WHERE f."ownerId"=$1`;
const setSelect = `SELECT s.id,s.name,s."folderId",
 (SELECT count(*)::int FROM vocab_cards c WHERE c."setId"=s.id) AS "cardCount"
 FROM vocab_sets s JOIN vocab_folders f ON f.id=s."folderId" WHERE f."ownerId"=$1`;

@Injectable()
export class VocabularyService {
  constructor(private readonly db: DataSource) {}
  private require<T = Record<string, unknown>>(rows: T[]): T {
    if (!rows.length) throw new NotFoundException('Nội dung không khả dụng.');
    return rows[0];
  }
  folders(owner: string) { return this.db.query(`${folderSelect} ORDER BY f."createdAt",f.id`, [owner]); }
  async folder(owner: string, id: string) {
    const folder = this.require(await this.db.query(`${folderSelect} AND f.id=$2`, [owner, id]));
    const sets = await this.db.query(`${setSelect} AND f.id=$2 ORDER BY s."createdAt",s.id`, [owner, id]);
    return { ...folder, sets };
  }
  async set(owner: string, id: string) {
    const set = this.require(await this.db.query(`${setSelect} AND s.id=$2`, [owner, id]));
    const cards = await this.db.query(`SELECT c.* FROM vocab_cards c JOIN vocab_sets s ON s.id=c."setId"
      JOIN vocab_folders f ON f.id=s."folderId" WHERE f."ownerId"=$1 AND s.id=$2 ORDER BY c."createdAt",c.id`, [owner, id]);
    return { ...set, cards };
  }
  async createFolder(owner: string, name: string) {
    const [row] = await this.db.query('INSERT INTO vocab_folders("ownerId",name) VALUES($1,$2) RETURNING id,name', [owner, name]);
    return { ...row, setCount: 0, cardCount: 0 };
  }
  // Every write under a folder shares this transaction lock, including card/set creates.
  private locked<T>(owner: string, id: string, kind: 'folder' | 'set' | 'card', action: (m: EntityManager, folderId: string) => Promise<T>) {
    return this.db.transaction(async m => {
      const joins = kind === 'folder' ? '' : kind === 'set'
        ? 'JOIN vocab_sets s ON s."folderId"=f.id'
        : 'JOIN vocab_sets s ON s."folderId"=f.id JOIN vocab_cards c ON c."setId"=s.id';
      const alias = kind === 'folder' ? 'f' : kind === 'set' ? 's' : 'c';
      const query = `SELECT f.id FROM vocab_folders f ${joins} WHERE f."ownerId"=$1 AND ${alias}.id=$2`;
      const folder = this.require<{ id: string }>(await m.query(query, [owner, id]));
      await m.query('SELECT pg_advisory_xact_lock(hashtext($1))', [folder.id]);
      this.require(await m.query(query, [owner, id]));
      return action(m, folder.id);
    });
  }
  renameFolder(owner: string, id: string, name: string) {
    return this.locked(owner, id, 'folder', async m => {
      await m.query('UPDATE vocab_folders SET name=$1,"updatedAt"=now() WHERE id=$2', [name, id]);
      return this.require(await m.query(`${folderSelect} AND f.id=$2`, [owner, id]));
    });
  }
  createSet(owner: string, id: string, name: string) {
    return this.locked(owner, id, 'folder', async m => {
      const [set] = await m.query('INSERT INTO vocab_sets("folderId",name) VALUES($1,$2) RETURNING id,name,"folderId"', [id, name]);
      return { ...set, cardCount: 0 };
    });
  }
  renameSet(owner: string, id: string, name: string) {
    return this.locked(owner, id, 'set', async m => {
      await m.query('UPDATE vocab_sets SET name=$1,"updatedAt"=now() WHERE id=$2', [name, id]);
      return this.require(await m.query(`${setSelect} AND s.id=$2`, [owner, id]));
    });
  }
  deleteFolder(owner: string, id: string, expected: DeleteDto) {
    return this.locked(owner, id, 'folder', async m => {
      const actual = this.require<{ setCount: number; cardCount: number }>(await m.query(`${folderSelect} AND f.id=$2`, [owner, id]));
      this.checkCounts(actual.setCount, actual.cardCount, expected);
      await m.query('DELETE FROM vocab_folders WHERE id=$1', [id]);
      return { deleted: true };
    });
  }
  deleteSet(owner: string, id: string, expected: DeleteDto) {
    return this.locked(owner, id, 'set', async m => {
      const actual = this.require<{ cardCount: number }>(await m.query(`${setSelect} AND s.id=$2`, [owner, id]));
      this.checkCounts(1, actual.cardCount, expected);
      await m.query('DELETE FROM vocab_sets WHERE id=$1', [id]);
      return { deleted: true };
    });
  }
  private checkCounts(sets: number, cards: number, expected: DeleteDto) {
    if (sets !== expected.expectedSetCount || cards !== expected.expectedCardCount)
      throw new ConflictException('Số bộ/thẻ đã thay đổi. Hãy tải lại và xác nhận xóa lần nữa.');
  }
  createCard(owner: string, id: string, card: CardDto) {
    return this.locked(owner, id, 'set', async m => {
      const [row] = await m.query('INSERT INTO vocab_cards("setId",meaning,reading,japanese) VALUES($1,$2,$3,$4) RETURNING *', [id, card.meaning, card.reading, card.japanese ?? '']);
      return row;
    });
  }
  importCards(owner: string, id: string, cards: CardDto[]) {
    return this.locked(owner, id, 'set', async m => {
      let imported = 0;
      for (const card of cards) {
        const rows = await m.query(`INSERT INTO vocab_cards("setId",meaning,reading,japanese)
          SELECT $1,$2,$3,$4 WHERE NOT EXISTS (
            SELECT 1 FROM vocab_cards WHERE "setId"=$1 AND meaning=$2 AND reading=$3 AND japanese=$4
          ) RETURNING id`, [id, card.meaning, card.reading, card.japanese ?? '']);
        imported += rows.length;
      }
      return { imported, skipped: cards.length - imported };
    });
  }
  updateCard(owner: string, id: string, card: CardDto) {
    return this.locked(owner, id, 'card', async m => {
      const [row] = await m.query('UPDATE vocab_cards SET meaning=$1,reading=$2,japanese=$3,"updatedAt"=now() WHERE id=$4 RETURNING *', [card.meaning, card.reading, card.japanese ?? '', id]);
      return row;
    });
  }
  deleteCard(owner: string, id: string) {
    return this.locked(owner, id, 'card', async m => {
      await m.query('DELETE FROM vocab_cards WHERE id=$1', [id]);
      return { deleted: true };
    });
  }
}
