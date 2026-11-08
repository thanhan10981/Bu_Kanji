export interface ExamAudio { src: string; fileName: string }

// Fixed, locally deployed files; never construct a path from user input.
const audioFiles: Record<string, ExamAudio> = {
  'exam-2025-07': { src: '/exams/exam-2025-07/listening.mp3', fileName: 'N3 07.2025 Choukai [New].mp3' },
  'exam-2025-12': { src: '/exams/exam-2025-12/listening.mp3', fileName: 'MP3-N3 12.2025 Choukai.mp3' },
  'exam-2026-07': { src: '/exams/exam-2026-07/listening.mp3', fileName: 'Nghe N3 T7-2026 (Yuuki Bui).mp3' },
};
export function examAudio(examId: string): ExamAudio | null { return audioFiles[examId] ?? null; }
