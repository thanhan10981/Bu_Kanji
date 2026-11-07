"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Send, RotateCcw, MessageSquarePlus, Bot } from 'lucide-react';
import { useChatStore } from '@/lib/chat/store';
import { useChatRequest } from '@/lib/chat/client';
import type { Message } from '@/lib/chat/schema';

function CopyButton({ text }: { text: () => string }) {
  const [status, setStatus] = useState('Sao chép');
  return <button type="button" className="ai-copy" onClick={async () => {
    try { await navigator.clipboard.writeText(text()); setStatus('Đã sao chép'); }
    catch { setStatus('Không sao chép được'); }
  }}><Copy size={14} /> {status}</button>;
}
function CodeBlock({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  return <div className="ai-code"><CopyButton text={() => ref.current?.textContent ?? ''} /><pre ref={ref}>{children}</pre></div>;
}

export function ChatPanel() {
  const { messages, setMessages, model } = useChatStore();
  const [draft, setDraft] = useState('');
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState('');
  const request = useChatRequest();
  const lock = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);
  const lastRequest = useRef<Message[]>([]);
  useEffect(() => {
    void Promise.resolve(useChatStore.persist.rehydrate()).catch(() => setStorageWarning('Không đọc được lịch sử trên trình duyệt.')).finally(() => setReady(true));
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, request.isPending]);

  const saveMessages = (next: Message[]) => {
    try { setMessages(next); } catch { setStorageWarning('Trình duyệt không lưu được lịch sử. Cuộc trò chuyện vẫn dùng được trong phiên này.'); }
  };
  const ask = async (next: Message[]) => {
    if (lock.current) return;
    lock.current = true; lastRequest.current = next;
    try {
      const result = await request.mutateAsync({ messages: next, model });
      saveMessages([...next, { role: 'assistant', content: result.text }]);
    } catch { /* TanStack exposes the error below. */ }
    finally { lock.current = false; }
  };
  const send = () => {
    if (!draft.trim() || lock.current || !ready) return;
    const next: Message[] = [...messages, { role: 'user', content: draft.trim() }];
    saveMessages(next); setDraft(''); void ask(next);
  };
  return <section className="ai-panel ai-chat" aria-labelledby="ai-chat-heading">
    <header className="ai-panel-header"><div><h2 id="ai-chat-heading">Trợ lý tiếng Nhật</h2><p>Hỏi nghĩa, cách đọc hoặc luyện ví dụ cùng AI.</p></div>
      <button className="btn-secondary" disabled={request.isPending || !ready} onClick={() => { saveMessages([]); request.reset(); setDraft(''); }}><MessageSquarePlus size={17} /> Cuộc trò chuyện mới</button></header>
    {storageWarning && <p className="ai-notice" role="status">{storageWarning}</p>}
    <div className="ai-messages" aria-live="polite" aria-busy={request.isPending}>
      {!ready ? <p role="status">Đang đọc lịch sử…</p> : !messages.length ? <div className="ai-welcome"><span className="ai-bot-icon"><Bot size={30} /></span><h3>Hôm nay bạn muốn học gì?</h3><p>Thử hỏi “Phân biệt 覚える và 思い出す, kèm ví dụ N3”.</p><button className="btn-secondary" onClick={() => setDraft('Phân biệt 覚える và 思い出す, kèm ví dụ N3.')}>Dùng câu hỏi gợi ý</button></div> : messages.map((message, index) => <article className={`ai-message ai-message-${message.role}`} key={index}>
        <div className="ai-message-label">{message.role === 'user' ? 'Bạn' : 'Bú Nihon AI'}</div>
        {message.role === 'user' ? <p className="ai-user-text">{message.content}</p> : <div className="ai-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
          pre: CodeBlock,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
          img: ({ alt }) => <span>{alt}</span>,
        }}>{message.content}</ReactMarkdown></div>}
        <CopyButton text={() => message.content} />
      </article>)}
      {request.isPending && <p className="ai-thinking" role="status"><span className="ai-spinner" /> AI đang soạn câu trả lời…</p>}
      <div ref={bottom} />
    </div>
    {request.isError && <div className="ai-error" role="alert"><p>{request.error.message}</p><button className="btn-secondary" disabled={request.isPending} onClick={() => void ask(lastRequest.current)}><RotateCcw size={16} /> Thử lại</button></div>}
    <form className="ai-compose" onSubmit={event => { event.preventDefault(); send(); }}>
      <label className="sr-only" htmlFor="ai-message">Tin nhắn cho AI</label>
      <textarea id="ai-message" value={draft} maxLength={12000} rows={3} placeholder="Hỏi về từ vựng tiếng Nhật…" disabled={!ready || request.isPending} onChange={event => setDraft(event.target.value)} onKeyDown={event => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); }
      }} />
      <div className="ai-compose-footer"><small>Enter gửi · Shift+Enter xuống dòng · {draft.length}/12.000</small><button className="btn-primary" disabled={!ready || request.isPending || !draft.trim()}><Send size={17} /> Gửi</button></div>
    </form>
    <p className="ai-footnote">Lịch sử lưu trên trình duyệt này (tối đa 60 tin). Mỗi lần gửi tối đa 20 tin gần nhất trong 40.000 ký tự. AI trả lời hoàn chỉnh, có thể mắc lỗi.</p>
  </section>;
}
