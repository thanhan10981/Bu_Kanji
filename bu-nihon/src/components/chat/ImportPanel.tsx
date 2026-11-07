"use client";

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, FileText, Trash2, Save, Download } from 'lucide-react';
import { useFileImport } from '@/lib/chat/client';
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
  const lock = useRef(false);
  const request = useFileImport();
  const client = useQueryClient();
  const folders = useQuery({ queryKey: ['vocabulary', user?.id, 'folders'], queryFn: vocabularyApi.folders, enabled: Boolean(user), retry: false });
  const folder = useQuery({ queryKey: ['vocabulary', user?.id, 'folder', folderId], queryFn: () => vocabularyApi.folder(folderId), enabled: Boolean(user && folderId), retry: false });
  const save = useMutation({ mutationFn: ({ target, rows }: { target: string; rows: CardInput[] }) => vocabularyApi.importCards(target, rows), retry: false });
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
  const busy = request.isPending || save.isPending || createDestination.isPending;
  const runImport = async () => {
    if (!file || lock.current) return;
    setError(''); setNotice('');
    if (!file.size || file.size > maxFileBytes) { setError('File cần có nội dung và không vượt 4 MB.'); return; }
    lock.current = true;
    try {
      const result = await request.mutateAsync({ file, model });
      setCards(result.cards); setSource(result.source); setSaved(false);
      setNotice(`Đã trích xuất ${result.cards.length} thẻ. Kiểm tra và sửa trước khi lưu.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể nhập file.'); }
    finally { lock.current = false; }
  };
  const saveCards = async () => {
    if (!user || !setId || lock.current || saved) return;
    setError(''); setNotice('');
    const parsed = importSchema.safeParse({ cards });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const row = typeof issue.path[1] === 'number' ? `Thẻ ${issue.path[1] + 1}: ` : '';
      setError(`${row}${issue.message}`); return;
    }
    lock.current = true;
    try {
      const result = await save.mutateAsync({ target: setId, rows: parsed.data.cards });
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
      <small>Tối đa 4 MB · 40.000 ký tự · PDF tối đa 30 trang · 200 thẻ/lần</small>
      <button className="btn-primary" disabled={!file || busy} onClick={() => void runImport()}>{request.isPending ? <><span className="ai-spinner" /> AI đang đọc file…</> : <><Upload size={17} /> {request.isError ? 'Thử nhập lại' : 'Trích xuất bằng AI'}</>}</button>
    </div>
    <p className="ai-footnote">Nội dung file sẽ được gửi tới gateway AI khi bạn chọn trích xuất. PDF scan cần OCR trước. Bản xem trước chỉ giữ trong trang này.</p>
    {error && <div className="ai-error" role="alert">{error}</div>}
    {notice && <p className="ai-notice" role="status">{notice}</p>}
    {!cards.length ? <p className="ai-empty">{source ? 'Bạn đã bỏ hết các thẻ. Chọn trích xuất lại để tạo bản xem trước mới.' : 'Chưa có thẻ xem trước. Chọn file để bắt đầu.'}</p> : <>
      <div className="ai-preview-heading"><h3>{cards.length} thẻ · {source}</h3><button className="btn-secondary" disabled={busy} onClick={exportCards}><Download size={16} /> Tải JSON</button></div>
      <div className="ai-table-wrap"><table className="ai-table"><thead><tr><th>#</th><th>Chữ Nhật</th><th>Hiragana</th><th>Nghĩa tiếng Việt</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>{cards.map((card, index) => <tr key={index}><td>{index + 1}</td>
        {(['japanese', 'reading', 'meaning'] as const).map(field => <td key={field}><input aria-label={`${field === 'japanese' ? 'Chữ Nhật' : field === 'reading' ? 'Hiragana' : 'Nghĩa'} thẻ ${index + 1}`} lang={field === 'meaning' ? 'vi' : 'ja'} value={card[field]} maxLength={field === 'meaning' ? 500 : 200} disabled={busy || saved} onChange={event => edit(index, field, event.target.value)} /></td>)}
        <td><button className="ai-remove" aria-label={`Bỏ thẻ ${index + 1}`} disabled={busy || saved} onClick={() => setCards(old => old.filter((_, i) => i !== index))}><Trash2 size={17} /></button></td></tr>)}</tbody></table></div>
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
