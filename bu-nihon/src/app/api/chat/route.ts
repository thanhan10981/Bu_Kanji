import { chatSchema } from '@/lib/chat/schema';
import { ChatError, gateway, guarded, outputText, readBody } from '@/lib/chat/server';

export const runtime = 'nodejs';
export const maxDuration = 150;
export async function POST(request: Request) {
  return guarded(request, async () => {
    let json: unknown;
    try { json = JSON.parse((await readBody(request, 200000)).toString('utf8')); }
    catch (error) { if (error instanceof ChatError) throw error; throw new ChatError(400, 'Nội dung JSON không hợp lệ.'); }
    const { model, messages } = chatSchema.parse(json);
    const text = outputText(await gateway('/responses', {
      model, stream: false,
      instructions: 'Bạn là trợ lý học tiếng Nhật của Bú Nihon. Trả lời bằng tiếng Việt, dùng Markdown khi hữu ích. Giải thích từ vựng, hiragana, nghĩa và ví dụ. Không bịa khi không biết.',
      input: messages.map(({ role, content }) => ({ role, content })),
    }));
    if (text.length > 24000) throw new ChatError(502, 'Câu trả lời vượt 24.000 ký tự. Hãy yêu cầu AI trả lời ngắn hơn.');
    return { text };
  });
}
