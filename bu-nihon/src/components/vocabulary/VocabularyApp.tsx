"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FolderOpen, Layers, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cardSchema, nameSchema, type CardInput } from '@/lib/vocabulary/schemas';
import { useVocabularyData, vocabularyApi as api } from '@/lib/vocabulary/api';
import { StudySession } from './StudySession';
import { StudyReport } from './StudyReport';
import { getLibrarySet } from '@/lib/vocabulary/library';
import { LibraryEntry, VocabularyLibrary } from './VocabularyLibrary';
import './vocabulary.css';

interface Props { folderId?: string; setId?: string; mode?: 'flashcard' | 'written' }
interface Values extends CardInput { name: string }
interface Editor {
  title: string; fields?: 'name' | 'card'; initial?: Partial<Values>; confirmation?: string;
  submit: (values: Values) => Promise<unknown>;
}
const errorText = (cause: unknown) => cause instanceof Error ? cause.message : 'Không thể lưu dữ liệu. Vui lòng thử lại.';

function VocabularyDialog({ editor, pending, save, close }: { editor: Editor; pending: boolean; save: (values: Values) => Promise<void>; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  const [values, setValues] = useState<Values>({ name: '', meaning: '', reading: '', japanese: '', ...editor.initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => { previous?.focus(); };
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    const parsed = editor.fields === 'name' ? nameSchema.safeParse(values) : editor.fields === 'card' ? cardSchema.safeParse(values) : null;
    if (parsed && !parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message]))); return;
    }
    lock.current = true; setErrors({}); setError('');
    try { await save({ ...values, ...(parsed?.success ? parsed.data : {}) }); }
    catch (cause) { setError(errorText(cause)); }
    finally { lock.current = false; }
  };
  return <dialog ref={dialog} className="vocab-dialog" aria-labelledby="vocab-dialog-title" onCancel={event => { event.preventDefault(); if (!pending) close(); }}>
    <form onSubmit={submit} noValidate>
      <div className="vocab-dialog-heading"><h2 id="vocab-dialog-title">{editor.title}</h2><button type="button" className="vocab-icon" aria-label="Đóng" disabled={pending} onClick={close}><X size={20} /></button></div>
      {editor.confirmation && <p>{editor.confirmation}</p>}
      {(editor.fields === 'name' ? ['name'] : editor.fields === 'card' ? ['meaning', 'reading', 'japanese'] : []).map(field => {
        const key = field as keyof Values;
        const labels = { name: 'Tên', meaning: 'Nghĩa tiếng Việt', reading: 'Cách đọc hiragana', japanese: 'Chữ Nhật (không bắt buộc)' };
        return <label className="vocab-field" key={key}>
          <span>{labels[key]}</span><input className="input-base" value={values[key]} disabled={pending}
            aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `vocab-error-${key}` : undefined}
            onChange={event => setValues(old => ({ ...old, [key]: event.target.value }))} />
          {errors[key] && <span id={`vocab-error-${key}`} className="vocab-error">{errors[key]}</span>}
        </label>;
      })}
      {error && <p role="alert" className="vocab-error">{error}</p>}
      <div className="vocab-actions"><button type="button" className="btn-secondary" onClick={close} disabled={pending}>Hủy</button>
        <button className={editor.confirmation ? 'btn-primary vocab-danger' : 'btn-primary'} disabled={pending} type="submit">{pending ? 'Đang lưu…' : editor.confirmation ? 'Xác nhận xóa' : 'Lưu'}</button></div>
    </form>
  </dialog>;
}

export function VocabularyApp(props: Props) {
  const librarySet = props.setId ? getLibrarySet(props.setId) : undefined;
  if (librarySet) return <VocabularyLibrary set={librarySet} mode={props.mode} />;
  if (!props.setId && !props.folderId) return <><LibraryEntry /><PersonalVocabulary {...props} /></>;
  return <PersonalVocabulary {...props} />;
}

function PersonalVocabulary(props: Props) {
  const user = useAppStore(s => s.user);
  const status = useAppStore(s => s.authStatus);
  const openLogin = useAppStore(s => s.setLoginModalOpen);
  if (status === 'loading') return <div className="vocab-root" role="status">Đang kiểm tra đăng nhập…</div>;
  if (status === 'error') return <section className="vocab-root card vocab-panel"><h1>Từ vựng</h1><p role="alert">Không thể kiểm tra phiên đăng nhập.</p><button className="btn-primary" onClick={() => window.location.reload()}>Thử lại</button></section>;
  if (!user) return <section className="vocab-root card vocab-empty"><FolderOpen size={42} /><h1>Từ vựng của bạn</h1><p>Tạo thư mục, bộ thẻ và luyện tập theo cách của bạn.</p><button className="btn-primary" onClick={() => openLogin(true)}>Đăng nhập để bắt đầu</button></section>;
  return <VocabularyContent key={`${user.id}:${props.folderId ?? ''}:${props.setId ?? ''}:${props.mode ?? ''}`} userId={user.id} {...props} />;
}

function VocabularyContent({ userId, folderId, setId, mode }: Props & { userId: string }) {
  const router = useRouter();
  const { folders, folder, set, mutation } = useVocabularyData(userId, folderId, setId);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState('');
  const active = setId ? set : folderId ? folder : folders;
  const busy = mutation.isPending;
  const folderData = folder.data;
  const setData = set.data;
  const previewLock = useRef(false);
  const preview = async (action: () => Promise<Editor>) => {
    if (previewLock.current) return;
    previewLock.current = true; setError('');
    try { setEditor(await action()); } catch (cause) { setError(errorText(cause)); }
    finally { previewLock.current = false; }
  };
  const save = async (values: Values) => {
    if (!editor) return;
    await mutation.mutateAsync(() => editor.submit(values)); setEditor(null);
  };
  if (active.isPending) return <div className="vocab-root" role="status">Đang tải từ vựng…</div>;
  if (active.isError) return <section className="vocab-root card vocab-panel"><Link href="/vocabulary">← Về Từ vựng</Link><h1>Không thể mở nội dung</h1><p role="alert">{errorText(active.error)}</p><button className="btn-primary" onClick={() => active.refetch()}>Thử lại</button></section>;
  if (mode && setData) return <div className="vocab-root"><StudySession set={setData} mode={mode} /></div>;

  return <div className="vocab-root">
    <nav className="vocab-breadcrumb" aria-label="Đường dẫn"><Link href="/vocabulary">Từ vựng</Link>
      {folderData && <><span>/</span><span>{folderData.name}</span></>}
      {setData && <><span>/</span><Link href={`/vocabulary/folders/${setData.folderId}`}>Thư mục</Link><span>/</span><span>{setData.name}</span></>}
    </nav>
    <header className="vocab-heading"><div><p className="vocab-eyebrow">BỘ SƯU TẬP CÁ NHÂN</p><h1>{setData?.name ?? folderData?.name ?? 'Từ vựng của bạn'}</h1>
      <p className="vocab-hint">{setData ? `${setData.cardCount} thẻ từ vựng` : folderData ? `${folderData.setCount} bộ · ${folderData.cardCount} thẻ` : 'Gom từng bài học. Nhớ từng từ mới.'}</p></div>
      <div className="vocab-actions">
        <Link className="btn-secondary" href="/vocabulary/import">Nhập từ file bằng AI</Link>
        {setData ? <>
          <button className="btn-primary" disabled={busy} onClick={() => setEditor({ title: 'Thêm thẻ', fields: 'card', submit: values => api.createCard(setData.id, values) })}><Plus size={17} /> Thêm thẻ</button>
          <button className="btn-secondary" disabled={busy} onClick={() => setEditor({ title: 'Đổi tên bộ', fields: 'name', initial: { name: setData.name }, submit: values => api.renameSet(setData.id, values.name) })}>Đổi tên bộ</button>
          <button className="btn-secondary vocab-text-danger" disabled={busy} onClick={() => preview(async () => {
            const latest = await api.set(setData.id);
            return { title: 'Xóa bộ thẻ?', confirmation: `“${latest.name}”: 1 bộ, ${latest.cardCount} thẻ sẽ bị xóa. Không thể hoàn tác.`, submit: async () => { await api.deleteSet(latest); router.push(`/vocabulary/folders/${latest.folderId}`); } };
          })}>Xóa bộ</button>
        </> : folderData ? <>
          <button className="btn-primary" disabled={busy} onClick={() => setEditor({ title: 'Tạo bộ thẻ', fields: 'name', submit: async values => { const created = await api.createSet(folderData.id, values.name); router.push(`/vocabulary/sets/${created.id}`); } })}><Plus size={17} /> Tạo bộ thẻ</button>
          <button className="btn-secondary" disabled={busy} onClick={() => setEditor({ title: 'Đổi tên thư mục', fields: 'name', initial: { name: folderData.name }, submit: values => api.renameFolder(folderData.id, values.name) })}>Đổi tên</button>
          <button className="btn-secondary vocab-text-danger" disabled={busy} onClick={() => preview(async () => {
            const latest = await api.folder(folderData.id);
            return { title: 'Xóa thư mục?', confirmation: `“${latest.name}”: ${latest.setCount} bộ, ${latest.cardCount} thẻ sẽ bị xóa. Không thể hoàn tác.`, submit: async () => { await api.deleteFolder(latest); router.push('/vocabulary'); } };
          })}>Xóa thư mục</button>
        </> : <button className="btn-primary" disabled={busy} onClick={() => setEditor({ title: 'Tạo thư mục', fields: 'name', submit: async values => { const created = await api.createFolder(values.name); router.push(`/vocabulary/folders/${created.id}`); } })}><Plus size={17} /> Tạo thư mục</button>}
      </div>
    </header>
    {error && <p role="alert" className="vocab-error">{error}</p>}
    {setData ? <>
      <div className="card vocab-mode-bar">
        <div><strong>Sẵn sàng ôn tập?</strong><p className="vocab-hint">Chọn cách học từ bộ thẻ này.</p></div>
        <div className="vocab-actions">{setData.cardCount ? <><Link className="btn-secondary" href={`/vocabulary/sets/${setData.id}/flashcard`}>Flashcard</Link><Link className="btn-primary" href={`/vocabulary/sets/${setData.id}/written`}>Tự luận</Link></>
          : <><button className="btn-secondary" disabled>Flashcard</button><button className="btn-primary" disabled>Tự luận</button></>}</div>
      </div>
      <StudyReport key={setData.id} set={setData} />
      {!setData.cards.length ? <div className="card vocab-empty"><Layers size={40} /><h2>Bộ chưa có thẻ</h2><p>Chọn “Thêm thẻ” để bắt đầu. Cần ít nhất một thẻ để luyện tập.</p></div>
        : <div className="vocab-card-list">{setData.cards.map((card, i) => <article className="card vocab-word" key={card.id}>
          <span className="vocab-number">{i + 1}</span><div className="vocab-word-main"><h2>{card.meaning}</h2><p lang="ja">{card.reading}</p>{card.japanese && <p className="vocab-hint" lang="ja">{card.japanese}</p>}</div>
          <div className="vocab-actions"><button className="vocab-icon" aria-label={`Sửa thẻ ${card.meaning}`} disabled={busy} onClick={() => setEditor({ title: 'Sửa thẻ', fields: 'card', initial: card, submit: values => api.updateCard(card.id, values) })}><Pencil size={18} /></button>
            <button className="vocab-icon vocab-text-danger" aria-label={`Xóa thẻ ${card.meaning}`} disabled={busy} onClick={() => setEditor({ title: 'Xóa thẻ?', confirmation: `Xóa thẻ “${card.meaning}”?`, submit: () => api.deleteCard(card.id) })}><Trash2 size={18} /></button></div>
        </article>)}</div>}
    </> : folderData ? <>
      {!folderData.sets.length ? <div className="card vocab-empty"><Layers size={40} /><h2>Thư mục chưa có bộ thẻ</h2><p>Tạo bộ đầu tiên, đặt tên theo bài học hoặc chủ đề của bạn.</p></div>
        : <div className="vocab-grid">{folderData.sets.map(item => <Link className="card card-hover vocab-collection" key={item.id} href={`/vocabulary/sets/${item.id}`}><Layers size={28} /><h2>{item.name}</h2><p>{item.cardCount} thẻ</p><span className="vocab-hint">Mở bộ thẻ →</span></Link>)}</div>}
    </> : <>
      {!folders.data?.length ? <div className="card vocab-empty"><FolderOpen size={44} /><h2>Bắt đầu bộ sưu tập của bạn</h2><p>Tạo thư mục, chẳng hạn N3, rồi thêm các bộ theo bài học.</p></div>
        : <div className="vocab-grid">{folders.data.map(item => <Link className="card card-hover vocab-collection" key={item.id} href={`/vocabulary/folders/${item.id}`}><FolderOpen size={30} /><h2>{item.name}</h2><p>{item.setCount} bộ · {item.cardCount} thẻ</p><span className="vocab-hint">Mở thư mục →</span></Link>)}</div>}
    </>}
    {editor && <VocabularyDialog editor={editor} pending={busy} save={save} close={() => setEditor(null)} />}
  </div>;
}
