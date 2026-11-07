import { z } from 'zod';
import { cardSchema } from '@/lib/vocabulary/schemas';

export const models = ['gpt-5.6-terra', 'gpt-5.6-luna'] as const;
// Leave room for multipart fields below Vercel's 4.5 MB request limit.
export const maxFileBytes = 4 * 1024 * 1024;
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(24000),
}).strict().refine(message => message.role !== 'user' || message.content.length <= 12000, 'Tin nhắn người dùng tối đa 12.000 ký tự.');
export const chatSchema = z.object({
  model: z.enum(models),
  messages: z.array(messageSchema).min(1).max(20),
}).strict().refine(data => data.messages.at(-1)?.role === 'user', 'Tin cuối phải là của người dùng.')
  .refine(data => data.messages.reduce((sum, item) => sum + item.content.length, 0) <= 40000, 'Ngữ cảnh tối đa 40.000 ký tự.');
export const importSchema = z.object({ cards: z.array(cardSchema).min(1).max(200) }).strict();
export type Message = z.infer<typeof messageSchema>;
export type Model = typeof models[number];

export function contextMessages(messages: Message[]): Message[] {
  const result: Message[] = [];
  let size = 0;
  for (const message of messages.slice(-20).reverse()) {
    if (size + message.content.length > 40000) break;
    result.unshift(message);
    size += message.content.length;
  }
  return result;
}
