import { models } from '@/lib/chat/schema';
import { ChatError, gateway, guarded } from '@/lib/chat/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 150;
export async function GET(request: Request) {
  return guarded(request, async () => {
    const parsed = z.object({ data: z.array(z.object({ id: z.string() })) }).safeParse(await gateway('/models'));
    if (!parsed.success) throw new ChatError(502, 'Danh sách model từ gateway không đúng định dạng.');
    return { models: models.filter(model => parsed.data.data.some(item => item.id === model)) };
  });
}
