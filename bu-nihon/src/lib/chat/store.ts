import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { messageSchema, models, type Message, type Model } from './schema';
import { z } from 'zod';

interface ChatState {
  messages: Message[];
  model: Model;
  setModel: (model: Model) => void;
  setMessages: (messages: Message[]) => void;
}
const savedSchema = z.object({ messages: z.array(messageSchema).max(60), model: z.enum(models) });
export const useChatStore = create<ChatState>()(persist(set => ({
  messages: [], model: 'gpt-5.6-luna',
  setModel: model => set({ model }),
  setMessages: messages => set({ messages: messages.slice(-60) }),
}), {
  name: 'bu-nihon-ai-chat', skipHydration: true,
  partialize: ({ messages, model }) => ({ messages, model }),
  merge: (saved, current) => {
    const parsed = savedSchema.safeParse(saved);
    return parsed.success ? { ...current, ...parsed.data } : current;
  },
}));
