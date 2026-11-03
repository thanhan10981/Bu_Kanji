import { VocabularyApp } from '@/components/vocabulary/VocabularyApp';
export default async function Page({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  return <VocabularyApp setId={setId} />;
}