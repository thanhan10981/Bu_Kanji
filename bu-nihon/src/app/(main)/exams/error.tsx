'use client';
import Link from 'next/link';
import '@/components/exams/exams.css';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div className="exam-root exam-empty" role="alert"><h2>Chưa thể mở phòng luyện đề</h2><p>Hãy thử tải lại. Bài đang làm đã lưu trên thiết bị sẽ được giữ nguyên.</p><button className="exam-button primary" onClick={reset}>Thử lại</button><Link href="/exams">Về thư viện đề</Link></div>;
}
