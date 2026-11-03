import { VocabularyApp } from '@/components/vocabulary/VocabularyApp';
export default async function Page({ params }: { params: Promise<{ folderId: string }> }) {
  const { folderId } = await params;
  return <VocabularyApp folderId={folderId} />;
}