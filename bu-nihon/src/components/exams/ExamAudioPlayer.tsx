'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, Headphones, Pause, Play, RotateCcw, RotateCw } from 'lucide-react';
import type { ExamAudio } from '@/lib/exams/audio';
import { formatTime } from '@/lib/exams/model';

export function ExamAudioPlayer({ audio, title, collapsed = false, follow = false }: { audio: ExamAudio | null; title: string; collapsed?: boolean; follow?: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const panel = useRef<HTMLDetailsElement>(null);
  const [failed, setFailed] = useState(false);
  const [rate, setRate] = useState(1);
  const [away, setAway] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (!follow || !panel.current) return;
    const observer = new IntersectionObserver(([entry]) => setAway(!entry.isIntersecting), { rootMargin: '-120px 0px 0px 0px' });
    observer.observe(panel.current);
    return () => observer.disconnect();
  }, [follow, audio?.src]);
  if (!audio) return null;
  const seek = (offset: number) => {
    const player = ref.current;
    if (player && Number.isFinite(player.duration)) player.currentTime = Math.max(0, Math.min(player.duration, player.currentTime + offset));
  };
  return <><details ref={panel} className="exam-panel exam-audio" open={!collapsed}>
    <summary><span className="exam-stat-icon violet"><Headphones size={21} /></span><span><strong>Nghe toàn bài</strong><small>{title} · MP3 gốc</small></span></summary>
    <div className="exam-audio-content">
      <audio ref={ref} controls preload="none" aria-label={`File nghe ${title}`} src={audio.src}
        onPlay={() => { setStarted(true); setPlaying(true); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onTimeUpdate={() => setTime(ref.current?.currentTime ?? 0)}
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
  </details>
    {follow && started && away && <aside className="exam-audio-floating" aria-label="Điều khiển bài nghe">
      <Headphones size={19} /><span>{failed ? 'Chưa phát được audio' : formatTime(time)}</span>
      <button aria-label="Lùi 10 giây" onClick={() => seek(-10)}><RotateCcw size={17} /><small>10s</small></button>
      <button className="exam-audio-floating-play" aria-label={playing ? 'Tạm dừng nghe' : 'Tiếp tục nghe'} onClick={() => { const player = ref.current; if (!player) return; if (player.paused) void player.play().catch(() => setFailed(true)); else player.pause(); }}>{playing ? <Pause size={19} /> : <Play size={19} />}</button>
      <button aria-label="Tới 10 giây" onClick={() => seek(10)}><RotateCw size={17} /><small>10s</small></button>
      <button className="exam-audio-floating-return" onClick={() => panel.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Trình phát</button>
    </aside>}
  </>;
}
