"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Wifi } from 'lucide-react';
import { chatFetch } from '@/lib/chat/client';
import { models, type Model } from '@/lib/chat/schema';
import { useChatStore } from '@/lib/chat/store';
import { useAppStore } from '@/lib/store';
import { ChatPanel } from './ChatPanel';
import { ImportPanel } from './ImportPanel';
import './chat.css';

export function VocabularyAI() {
  const { model, setModel } = useChatStore();
  const user = useAppStore(state => state.user);
  const authStatus = useAppStore(state => state.authStatus);
  const openLogin = useAppStore(state => state.setLoginModalOpen);
  const connection = useQuery({ queryKey: ['chatmock-models'], queryFn: () => chatFetch<{ models: Model[] }>('/api/chat/models'), enabled: false, retry: false });
  return <div className="ai-page">
    <Link className="ai-back" href="/vocabulary">← Về Từ vựng</Link>
    <header className="ai-heading"><div><p className="ai-eyebrow"><Sparkles size={16} /> BÚ NIHON AI</p><h1>Nhập từ vựng bằng AI</h1><p>Biến tài liệu của bạn thành những từ mới dễ học.</p></div>
      <div className="ai-controls"><label htmlFor="ai-model">Model AI</label><select id="ai-model" value={model} onChange={event => setModel(event.target.value as Model)}><option value={models[0]}>Terra</option><option value={models[1]}>Luna</option></select>
        <button className="btn-secondary" disabled={connection.isFetching} onClick={() => void connection.refetch()}><Wifi size={16} /> {connection.isFetching ? 'Đang kiểm tra…' : 'Kiểm tra kết nối'}</button></div>
    </header>
    {!user && authStatus !== 'loading' && <p className="ai-notice">Đăng nhập để chat và nhập từ vựng bằng AI trên website. <button className="ai-link" onClick={() => openLogin(true)}>Đăng nhập</button></p>}
    {connection.isError && <p className="ai-error" role="alert">{connection.error.message}</p>}
    {connection.isSuccess && <p className="ai-notice" role="status">{connection.data.models.length ? `Gateway đã kết nối. Model khả dụng: ${connection.data.models.join(', ')}.` : 'Gateway phản hồi nhưng chưa có Terra/Luna khả dụng.'}</p>}
    <div className="ai-layout"><ImportPanel /><ChatPanel /></div>
  </div>;
}
