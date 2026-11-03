import { notFound } from 'next/navigation';
import { VocabularyApp } from '@/components/vocabulary/VocabularyApp';
export default async function Page({ params }: { params: Promise<{ setId: string; mode: string }> }) {
  const { setId, mode } = await params;
  if (mode !== 'flashcard' && mode !== 'written') notFound();
  return <VocabularyApp setId={setId} mode={mode} />;
}