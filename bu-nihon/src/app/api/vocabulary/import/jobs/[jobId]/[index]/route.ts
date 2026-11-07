import { z } from 'zod';
import { guarded } from '@/lib/chat/server';
import { importBackend } from '@/lib/chat/backend';
import { extractVocabulary } from '@/lib/chat/extract';
import { models } from '@/lib/chat/schema';
import { cardSchema } from '@/lib/vocabulary/schemas';

export const runtime = 'nodejs';
export const maxDuration = 150;
const batchSchema = z.object({ text: z.string().min(1).max(10000), model: z.enum(models), cards: z.array(cardSchema).max(200).nullable() });
export async function POST(request: Request, context: { params: Promise<{ jobId: string; index: string }> }) {
  return guarded(request, async () => {
    const params = await context.params;
    const id = z.uuid().parse(params.jobId);
    const index = z.coerce.number().int().min(0).max(400).parse(params.index);
    const path = `${id}/batches/${index}`;
    const batch = batchSchema.parse(await importBackend(request, path));
    if (batch.cards !== null) return { cards: batch.cards };
    const cards = await extractVocabulary(batch.text, batch.model);
    const stored = await importBackend<{ cards: unknown }>(request, path, { cards });
    return { cards: z.array(cardSchema).max(200).parse(stored.cards) };
  });
}
