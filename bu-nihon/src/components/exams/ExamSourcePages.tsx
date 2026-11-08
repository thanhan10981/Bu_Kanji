'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, Loader2, Maximize2, Minus, Plus, X } from 'lucide-react';
import type { SourcePage } from '@/lib/exams/schema';

function PageZoom({ page, onClose }: { page: SourcePage; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [zoom, setZoom] = useState(2);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog className="exam-page-dialog" ref={dialog} aria-label={`Phóng to trang ${page.page}`} onCancel={event => { event.preventDefault(); onClose(); }}>
    <div className="exam-page-dialog-tools"><strong>Trang {page.page}</strong><button aria-label="Thu nhỏ" disabled={zoom <= 1} onClick={() => setZoom(value => value - 0.5)}><Minus size={17} /></button><span>{zoom * 100}%</span><button aria-label="Phóng lớn" disabled={zoom >= 4} onClick={() => setZoom(value => value + 0.5)}><Plus size={17} /></button><button autoFocus aria-label="Đóng phóng to" onClick={onClose}><X size={20} /></button></div>
    <p className="exam-small-note">Cuộn ngang/dọc để xem chi tiết. Nhấn Esc hoặc nút đóng để quay lại.</p>
    <div className="exam-page-zoom-scroll"><Image unoptimized src={page.src} width={page.width} height={page.height} alt={`Trang ${page.page} phóng to`} style={{ width: `${zoom * 100}%`, maxWidth: 'none', height: 'auto' }} /></div>
  </dialog>;
}

export function ExamSourcePages({ pages, initialPage, pdfUrl, label = 'Đề gốc' }: { pages: SourcePage[]; initialPage?: number; pdfUrl?: string; label?: string }) {
  const [index, setIndex] = useState(() => Math.max(0, pages.findIndex(page => page.page === initialPage)));
  const [zoom, setZoom] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const page = pages[Math.min(index, pages.length - 1)];
  if (!page) return null;
  const change = (value: number) => { setIndex(value); setLoaded(false); setFailed(false); };
  return <section className="exam-original" aria-label={label}>
    <div className="exam-original-tools"><span><BookOpen size={15} />{label}</span><label className="exam-page-select">Trang <select aria-label={`Trang ${label}`} value={index} onChange={event => change(Number(event.target.value))}>{pages.map((item, i) => <option key={item.page} value={i}>{item.page}</option>)}</select></label><button className="exam-text-button" onClick={() => setZoom(true)}><Maximize2 size={14} />Phóng to</button></div>
    <div className="exam-original-image">
      {!loaded && !failed && <p className="exam-page-loading" role="status"><Loader2 className="exam-spin" size={17} />Đang tải trang gốc…</p>}
      <Image key={`${page.src}:${retry}`} unoptimized src={page.src} width={page.width} height={page.height}
        alt={`${label}, trang ${page.page}. Câu hỏi, hình và lựa chọn giữ nguyên bố cục tài liệu.`}
        onLoad={() => { setLoaded(true); setFailed(false); }} onError={() => { setFailed(true); setLoaded(false); }} />
      {failed && <div className="exam-notice" role="alert">Chưa tải được trang gốc. <button className="exam-text-button" onClick={() => { setFailed(false); setRetry(value => value + 1); }}>Thử tải lại trang</button></div>}
    </div>
    <div className="exam-original-footer"><button className="exam-text-button" aria-label="Trang trước" disabled={index === 0} onClick={() => change(index - 1)}><ArrowLeft size={14} />Trước</button><span>{index + 1}/{pages.length} trang</span><button className="exam-text-button" aria-label="Trang sau" disabled={index >= pages.length - 1} onClick={() => change(index + 1)}>Sau<ArrowRight size={14} /></button></div>
    {pdfUrl && <a className="exam-text-button exam-original-pdf" href={`${pdfUrl}#page=${page.page}`} target="_blank" rel="noreferrer">Mở PDF gốc trong tab mới<ExternalLink size={13} /></a>}
    {zoom && <PageZoom page={page} onClose={() => setZoom(false)} />}
  </section>;
}

export function ExamScriptReview({ pages }: { pages: SourcePage[] }) {
  const [open, setOpen] = useState(false);
  return <details className="exam-script-review" onToggle={event => setOpen(event.currentTarget.open)}><summary><BookOpen size={16} />Xem script nghe và giải đáp gốc</summary>
    {open && <ExamSourcePages pages={pages} label="Script nghe" />}
  </details>;
}
