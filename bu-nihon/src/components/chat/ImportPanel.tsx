"use client";

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Trash2, Save, Download } from 'lucide-react';
import { useFileImport } from '@/lib/chat/import-client';
import { useChatStore } from '@/lib/chat/store';
import { useAppStore } from '@/lib/store';
import { vocabularyApi } from '@/lib/vocabulary/api';
import { importSchema, maxFileBytes } from '@/lib/chat/schema';
import type { CardInput } from '@/lib/vocabulary/schemas';

export function ImportPanel() {
  const model = useChatStore(s => s.model);
  const user = useAppStore(s => s.user);
  const openLogin = useAppStore(s => s.setLoginModalOpen);
  const [file, setFile] = useState<File | null>(null);
  const [cards, setCards] = useState<CardInput[]>([]);
  const [source, setSource] = useState('');
  const [folderId, setFolderId] = useState('');
  const [setId, setSetId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [newFolder, setNewFolder] = useState('');
  const [newSet, setNewSet] = useState('');
  const [page, setPage] = useState(0);
  const [removing, setRemoving] = useState(false);
  const lock = useRef(false);
  const request = useFileImport(user?.id);
  const client = useQueryClient();
  const folders = useQuery({ queryKey: ['vocabulary', user?.id, 'folders'], queryFn: vocabularyApi.folders, enabled: Boolean(user), retry: false });
  const folder = useQuery({ queryKey: ['vocabulary', user?.id, 'folder', folderId], queryFn: () => vocabularyApi.folder(folderId), enabled: Boolean(user && folderId), retry: false });
  const save = useMutation({ mutationFn: async ({ target, rows }: { target: string; rows: CardInput[] }) => {
    let imported = 0; let skipped = 0;
    for (let index = 0; index < rows.length; index += 200) {
      setNotice(`Đang lưu thẻ ${index + 1}–${Math.min(index + 200, rows.length)}/${rows.length}. Nếu gián đoạn, thử lại sẽ bỏ qua thẻ đã lưu.`);
      const result = await vocabularyApi.importCards(target, rows.slice(index, index + 200));
      imported += result.imported; skipped += result.skipped;
    }
    return { imported, skipped };
  }, retry: false });
  const createDestination = useMutation({ mutationFn: async (kind: 'folder' | 'set') => {
    if (kind === 'folder') {
      const created = await vocabularyApi.createFolder(newFolder.trim());
      setFolderId(created.id); setSetId(''); setNewFolder('');
    } else {
      const created = await vocabularyApi.createSet(folderId, newSet.trim());
      setSetId(created.id); setNewSet('');
    }
    await client.invalidateQueries({ queryKey: ['vocabulary', user?.id] });
  }, retry: false });
  const busy = request.isPending || save.isPending || createDestination.isPending || removing;
  const pageIndex = Math.min(page, Math.max(0, Math.ceil(cards.length / 50) - 1));
  const runImport = async () => {
    if ((!file && !request.bookmark) || lock.current) return;
    if (!user) { openLogin(true); return; }
    setError(''); setNotice('');
    if (file && (!file.size || file.size > maxFileBytes)) { setError('File cần có nội dung và không vượt 100 MB.'); return; }
    lock.current = true;
    try {
      setSaved(false); setPage(0);
      const result = await request.mutateAsync({ file: file ?? undefined, model, onCards: (rows, name) => { setCards(rows); setSource(name); } });
      setCards(result.cards); setSource(result.source); setSaved(false);
      setNotice(`Đã trích xuất ${result.cards.length} thẻ. Kiểm tra và sửa trước khi lưu.`);
    } catch (cause) { setError(cause instanceof Error && cause.name === 'AbortError' ? 'Đã tạm dừng. Chọn tiếp tục để xử lý các phần còn lại.' : cause instanceof Error ? cause.message : 'Không thể nhập file.'); }
    finally { lock.current = false; }
  };
  const saveCards = async () => {
    if (!user || !setId || lock.current || saved) return;
    setError(''); setNotice('');
    const validated: CardInput[] = [];
    for (let index = 0; index < cards.length; index += 200) {
      const parsed = importSchema.safeParse({ cards: cards.slice(index, index + 200) });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const row = typeof issue.path[1] === 'number' ? `Thẻ ${index + issue.path[1] + 1}: ` : '';
        setError(`${row}${issue.message}`); return;
      }
      validated.push(...parsed.data.cards);
    }
    lock.current = true;
    try {
      const result = await save.mutateAsync({ target: setId, rows: validated });
      setSaved(true); setNotice(`Đã lưu ${result.imported} thẻ, bỏ qua ${result.skipped} thẻ trùng.`);
      await client.invalidateQueries({ queryKey: ['vocabulary', user.id] });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể lưu bộ thẻ.'); }
    finally { lock.current = false; }
  };
  const exportCards = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ cards }, null, 2)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'tu-vung-ai.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const edit = (index: number, field: keyof CardInput, value: string) => {
    setCards(old => old.map((card, i) => i === index ? { ...card, [field]: value } : card)); setNotice('');
  };
  return <section className="ai-panel ai-import" aria-labelledby="ai-import-heading">
    <header className="ai-panel-header"><div><h2 id="ai-import-heading"><FileText size={22} /> Từ tài liệu đến bộ thẻ</h2><p>1. Tải file → 2. Kiểm tra từ → 3. Lưu và học</p></div></header>
    <div className="ai-upload"><Upload size={30} /><label htmlFor="ai-file">Chọn tài liệu từ vựng của bạn</label><p>TXT, CSV, TSV, MD, JSON, DOCX, PDF có chữ</p>
      <input id="ai-file" type="file" accept=".txt,.csv,.tsv,.md,.json,.docx,.pdf" disabled={busy} onChange={event => { setFile(event.target.files?.[0] ?? null); setError(''); }} />
      <small>Tối đa 100 MB · PDF tối đa 1.000 trang · Tự xử lý nhiều đợt</small>
      <button className="btn-primary" disabled={(!file && !request.bookmark) || busy} onClick={() => void runImport()}>{request.isPending ? <><span className="ai-spinner" /> Đang xử lý…</> : <><Upload size={17} /> {request.bookmark ? 'Tiếp tục / khôi phục kết quả' : 'Trích xuất bằng AI'}</>}</button>
      {request.isPending && <button className="btn-secondary" onClick={request.pause}>Tạm dừng</button>}
      {request.progress && <div className="ai-import-progress" role="status"><progress max={request.progress.total || 1} value={request.progress.done} aria-label={request.progress.message} /><p>{request.progress.message}</p></div>}
      {request.bookmark && <><small>Lần nhập được giữ 24 giờ: {request.bookmark.name}. Nếu tải chưa xong, chọn lại đúng file gốc.</small><button className="btn-secondary" disabled={busy} onClick={async () => { setRemoving(true); try { await request.remove(); setNotice('Đã xóa dữ liệu nhập tạm trên server.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể xóa lần nhập.'); } finally { setRemoving(false); } }}>Xóa lần nhập tạm</button></>}
    </div>
    <p className="ai-footnote">Cần đăng nhập. File được tải từng phần và giữ tạm tối đa 24 giờ; phần chữ được gửi tới AI theo từng đợt (tối đa 200 thẻ/đợt). Mỗi đợt dùng một lượt AI. PDF scan cần OCR trước. Giới hạn 2 triệu ký tự chữ/tài liệu.</p>
    {error && <div className="ai-error" role="alert">{error}</div>}
    {notice && <p className="ai-notice" role="status">{notice}</p>}
    {!cards.length ? <p className="ai-empty">{source ? 'Bạn đã bỏ hết các thẻ. Chọn trích xuất lại để tạo bản xem trước mới.' : 'Chưa có thẻ xem trước. Chọn file để bắt đầu.'}</p> : <>
      <div className="ai-preview-heading"><h3>{cards.length} thẻ · {source}</h3><button className="btn-secondary" disabled={busy} onClick={exportCards}><Download size={16} /> Tải JSON</button></div>
      <div className="ai-table-wrap"><table className="ai-table"><thead><tr><th>#</th><th>Chữ Nhật</th><th>Hiragana</th><th>Nghĩa tiếng Việt</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{cards.slice(pageIndex * 50, (pageIndex + 1) * 50).map((card, offset) => { const index = pageIndex * 50 + offset; return <tr key={index}><td>{index + 1}</td>
        {(['japanese', 'reading', 'meaning'] as const).map(field => <td key={field}><input aria-label={`${field === 'japanese' ? 'Chữ Nhật' : field === 'reading' ? 'Hiragana' : 'Nghĩa'} thẻ ${index + 1}`} lang={field === 'meaning' ? 'vi' : 'ja'} value={card[field]} maxLength={field === 'meaning' ? 500 : 200} disabled={busy || saved} onChange={event => edit(index, field, event.target.value)} /></td>)}
        <td><button className="ai-remove" aria-label={`Bỏ thẻ ${index + 1}`} disabled={busy || saved} onClick={() => setCards(old => old.filter((_, i) => i !== index))}><Trash2 size={17} /></button></td></tr>; })}</tbody></table></div>
      {cards.length > 50 && <nav className="ai-pagination" aria-label="Trang xem trước"><button className="btn-secondary" disabled={pageIndex === 0} onClick={() => setPage(pageIndex - 1)}>Trước</button><span>Trang {pageIndex + 1}/{Math.ceil(cards.length / 50)}</span><button className="btn-secondary" disabled={(pageIndex + 1) * 50 >= cards.length} onClick={() => setPage(pageIndex + 1)}>Sau</button></nav>}
      <div className="ai-save"><h3>Lưu vào bộ thẻ cá nhân</h3>
        {!user ? <p>Đăng nhập để lưu và luyện tập. Bạn vẫn có thể tải bản JSON. <button className="ai-link" onClick={() => openLogin(true)}>Đăng nhập</button></p> : <>
          {createDestination.isError && <p className="ai-error" role="alert">{createDestination.error.message}</p>}
          {!saved && <div className="ai-save-fields"><label>Tạo thư mục mới<input className="input-base" aria-label="Tên thư mục mới" maxLength={120} value={newFolder} disabled={busy} onChange={event => setNewFolder(event.target.value)} /></label><button className="btn-secondary" disabled={busy || !newFolder.trim()} onClick={() => createDestination.mutate('folder')}>Tạo thư mục</button></div>}
          {folders.isPending ? <p role="status">Đang tải thư mục…</p> : folders.isError ? <p role="alert">Không tải được thư mục. <button className="ai-link" onClick={() => void folders.refetch()}>Thử lại</button></p> : !folders.data?.length ? <p>Chưa có thư mục. Tạo thư mục mới phía trên để giữ nguyên bản xem trước.</p> : <>
            <div className="ai-save-fields"><label>Thư mục<select value={folderId} disabled={busy || saved} onChange={event => { setFolderId(event.target.value); setSetId(''); }}><option value="">Chọn thư mục</option>{folders.data.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Bộ thẻ<select value={setId} disabled={!folder.data || busy || saved} onChange={event => setSetId(event.target.value)}><option value="">Chọn bộ thẻ</option>{folder.data?.sets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
            {folderId && folder.isPending && <p role="status">Đang tải bộ thẻ…</p>}
            {folder.isError && <p role="alert">Không tải được bộ thẻ. <button className="ai-link" onClick={() => void folder.refetch()}>Thử lại</button></p>}
            {folderId && !saved && <div className="ai-save-fields"><label>Tạo bộ thẻ mới<input className="input-base" aria-label="Tên bộ thẻ mới" maxLength={120} value={newSet} disabled={busy} onChange={event => setNewSet(event.target.value)} /></label><button className="btn-secondary" disabled={busy || !newSet.trim()} onClick={() => createDestination.mutate('set')}>Tạo bộ thẻ</button></div>}
            {folder.data && !folder.data.sets.length && <p>Thư mục chưa có bộ. Tạo bộ thẻ mới để lưu các từ đã trích xuất.</p>}
            <button className="btn-primary" disabled={!setId || busy || saved} onClick={() => void saveCards()}><Save size={17} /> {save.isPending ? 'Đang lưu…' : saved ? 'Đã lưu' : `Lưu ${cards.length} thẻ`}</button>
            {saved && <Link className="ai-link" href={`/vocabulary/sets/${setId}`}>Mở bộ thẻ để học →</Link>}
          </>}
        </>}
      </div>
    </>}
  </section>;
}
