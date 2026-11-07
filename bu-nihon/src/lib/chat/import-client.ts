"use client";
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { chatFetch } from './client';
import { models, maxFileBytes, importPartBytes, type Model } from './schema';
import { cardSchema, type CardInput } from '@/lib/vocabulary/schemas';

const bookmarkSchema = z.object({ id: z.uuid(), name: z.string(), size: z.number(), lastModified: z.number(), model: z.enum(models) });
type Bookmark = z.infer<typeof bookmarkSchema>;
interface ImportStatus extends Bookmark { status: 'uploading' | 'extracting' | 'ready' | 'failed' | 'completed'; parts: number[]; total: number; completed: number; error: string | null; pagesRead: number; totalPages: number }
interface Progress { done: number; total: number; message: string }

export function useFileImport(userId?: string) {
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const controller = useRef<AbortController | null>(null);
  const key = `bu-nihon-import:${userId ?? 'guest'}`;
  useEffect(() => {
    let mounted = true;
    void Promise.resolve().then(() => {
      try {
        const parsed = bookmarkSchema.safeParse(JSON.parse(localStorage.getItem(key) ?? 'null'));
        if (mounted) setBookmark(parsed.success ? parsed.data : null);
      } catch { if (mounted) setBookmark(null); }
    });
    return () => { mounted = false; controller.current?.abort(); };
  }, [key]);
  const remember = (value: Bookmark | null) => {
    setBookmark(value);
    try { if (value) localStorage.setItem(key, JSON.stringify(value)); else localStorage.removeItem(key); } catch { /* The current page still retains the job ID. */ }
  };
  const mutation = useMutation({ retry: false, mutationFn: async ({ file, model, onCards }: { file?: File; model: Model; onCards?: (cards: CardInput[], source: string) => void }) => {
    if (!userId) throw new Error('Vui lòng đăng nhập để nhập tài liệu 100 MB.');
    if (file && (!file.size || file.size > maxFileBytes)) throw new Error('File cần có nội dung và không vượt 100 MB.');
    const abort = new AbortController(); controller.current = abort;
    const signal = abort.signal;
    const call = <T>(path: string, init?: RequestInit) => chatFetch<T>(`/api/ai/imports${path}`, { ...init, signal });
    let job = bookmark;
    if (job && file && (file.name !== job.name || file.size !== job.size || file.lastModified !== job.lastModified)) throw new Error('Đang có lần nhập được lưu. Chọn đúng file gốc để tiếp tục hoặc xóa lần nhập cũ trước.');
    if (!job) {
      if (!file) throw new Error('Chọn file để bắt đầu.');
      setProgress({ done: 0, total: file.size, message: 'Đang tạo lần nhập…' });
      const created = await call<{ id: string }>('', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name, size: file.size, lastModified: file.lastModified, model }) });
      job = { id: created.id, name: file.name, size: file.size, lastModified: file.lastModified, model }; remember(job);
    }
    let status = await call<ImportStatus>(`/${job.id}`);
    if (status.status === 'uploading') {
      const count = Math.ceil(job.size / importPartBytes);
      const uploaded = new Set(status.parts);
      if (uploaded.size < count && !file) throw new Error('Chọn lại đúng file gốc để tải tiếp phần còn thiếu.');
      let bytes = status.parts.reduce((n, index) => n + Math.min(importPartBytes, job!.size - index * importPartBytes), 0);
      setProgress({ done: bytes, total: job.size, message: 'Đang tải file lên…' });
      for (let index = 0; index < count; index++) {
        if (uploaded.has(index)) continue;
        signal.throwIfAborted();
        const part = file!.slice(index * importPartBytes, Math.min((index + 1) * importPartBytes, job.size));
        await call(`/${job.id}/parts/${index}`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: part });
        bytes += part.size;
        setProgress({ done: bytes, total: job.size, message: `Đang tải file: ${Math.round(bytes / job.size * 100)}%` });
      }
    }
    if (status.status === 'uploading' || status.status === 'failed') await call(`/${job.id}/prepare`, { method: 'POST' });
    const started = Date.now();
    do {
      signal.throwIfAborted();
      status = await call<ImportStatus>(`/${job.id}`);
      if (status.status === 'failed') throw new Error(status.error ?? 'Đọc tài liệu bị gián đoạn. Chọn tiếp tục để thử lại.');
      if (status.status !== 'extracting') break;
      setProgress({ done: status.pagesRead, total: status.totalPages || 1, message: status.totalPages ? `Đang đọc PDF: ${status.pagesRead}/${status.totalPages} trang…` : 'Đang đọc và chia tài liệu…' });
      if (Date.now() - started > 5 * 60 * 1000) throw new Error('Đọc file lâu hơn dự kiến. Tiến độ được giữ lại; chọn tiếp tục sau.');
      await new Promise<void>((resolve, reject) => {
        const stop = () => { clearTimeout(timer); reject(new DOMException('Paused', 'AbortError')); };
        const timer = setTimeout(() => { signal.removeEventListener('abort', stop); resolve(); }, 2000);
        signal.addEventListener('abort', stop, { once: true });
      });
    } while (true);
    if (!['ready', 'completed'].includes(status.status) || !status.total) throw new Error('Tài liệu chưa sẵn sàng xử lý. Hãy thử tiếp tục.');
    const cards: CardInput[] = [];
    const seen = new Set<string>();
    for (let index = 0; index < status.total; index++) {
      signal.throwIfAborted();
      setProgress({ done: index, total: status.total, message: `AI đang xử lý phần ${index + 1}/${status.total}…` });
      let batch = await call<{ cards: CardInput[] | null }>(`/${job.id}/batches/${index}`);
      if (batch.cards === null) batch = await chatFetch<{ cards: CardInput[] }>(`/api/vocabulary/import/jobs/${job.id}/${index}`, { method: 'POST', signal });
      const parsed = z.array(cardSchema).max(200).parse(batch.cards);
      for (const card of parsed) {
        const identity = JSON.stringify([card.japanese, card.reading, card.meaning]);
        if (!seen.has(identity)) { seen.add(identity); cards.push(card); }
      }
      onCards?.([...cards], job.name);
      setProgress({ done: index + 1, total: status.total, message: `Đã xử lý ${index + 1}/${status.total} phần · ${cards.length} thẻ` });
    }
    if (!cards.length) throw new Error('AI không tìm thấy từ vựng phù hợp trong tài liệu.');
    return { cards, source: job.name };
  } });
  const remove = async () => {
    if (!bookmark) return;
    try {
      await chatFetch(`/api/ai/imports/${bookmark.id}`, { method: 'DELETE' });
    } catch (error) {
      // A missing/expired bookmark can safely be discarded locally.
      const message = error instanceof Error ? error.message : '';
      if (!/hết hạn sau 24|không tồn tại/.test(message)) throw error;
    }
    remember(null); setProgress(null); mutation.reset();
  };
  return { ...mutation, bookmark, progress, pause: () => controller.current?.abort(), remove };
}
