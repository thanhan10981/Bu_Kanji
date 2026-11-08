'use client';
import { useRef, useState } from 'react';
import { Download, Headphones, RotateCcw, RotateCw } from 'lucide-react';
import type { ExamAudio } from '@/lib/exams/audio';

export function ExamAudioPlayer({ audio, title, collapsed = false }: { audio: ExamAudio | null; title: string; collapsed?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);
  const [rate, setRate] = useState(1);
  if (!audio) return null;
  const seek = (offset: number) => {
    const player = ref.current;
    if (player && Number.isFinite(player.duration)) player.currentTime = Math.max(0, Math.min(player.duration, player.currentTime + offset));
  };
  return <details className="exam-panel exam-audio" open={!collapsed}>
    <summary><span className="exam-stat-icon violet"><Headphones size={21} /></span><span><strong>Nghe toàn bài</strong><small>{title} · MP3 gốc</small></span></summary>
    <div className="exam-audio-content">
      <audio ref={ref} controls preload="none" aria-label={`File nghe ${title}`} src={audio.src}
        onError={() => setFailed(true)} onLoadedMetadata={() => { setFailed(false); if (ref.current) ref.current.playbackRate = rate; }}>
        Trình duyệt chưa hỗ trợ phát audio. Bạn có thể tải MP3 ở liên kết bên dưới.
      </audio>
      <div className="exam-audio-tools"><button type="button" className="exam-text-button" onClick={() => seek(-10)} aria-label="Lùi 10 giây"><RotateCcw size={14} />10s</button><button type="button" className="exam-text-button" onClick={() => seek(10)} aria-label="Tới 10 giây"><RotateCw size={14} />10s</button>
        <label>Tốc độ <select value={rate} onChange={event => { const value = Number(event.target.value); setRate(value); if (ref.current) ref.current.playbackRate = value; }}>{[0.75, 1, 1.25, 1.5].map(value => <option key={value} value={value}>{value}×</option>)}</select></label>
        <a className="exam-text-button" href={audio.src} download={audio.fileName}><Download size={14} />Tải MP3</a>
      </div>
      {failed && <p className="exam-notice" role="alert">Chưa tải được file nghe. Kiểm tra kết nối rồi <button className="exam-text-button" onClick={() => ref.current?.load()}>thử lại</button>, hoặc tải MP3.</p>}
      <p className="exam-small-note">Đây là bản ghi toàn bài, chưa chia mốc từng câu. Bạn có thể tua đến nhóm muốn nghe; hình và lựa chọn nằm trong trang đề gốc. Phần 3 và 5 có câu hỏi/lựa chọn trong audio.</p>
    </div>
  </details>;
}
