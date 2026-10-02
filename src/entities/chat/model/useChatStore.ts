import { create } from 'zustand'

import type { Chat } from '@/entities/chat/model/types'

type ChatStore = {
  chat_by_id: Record<string, Chat>
  chat_ids: string[]
  active_chat_id: string | null
  upsertChat: (chat: Chat) => void
  setActiveChat: (chat_id: string | null) => void
  reset: () => void
}

const INITIAL_STATE = {
  chat_by_id: {},
  chat_ids: [],
  active_chat_id: null,
} satisfies Pick<ChatStore, 'chat_by_id' | 'chat_ids' | 'active_chat_id'>

/** Пустые поля нового снимка не затирают уже известные значения (уведомления беднее getContactInfo). */
function mergeChat(existing: Chat, next: Chat): Chat {
  return {
    id: existing.id,
    phone: next.phone ?? existing.phone,
    title: next.title ?? existing.title,
    avatar_url: next.avatar_url ?? existing.avatar_url,
  }
}

export const useChatStore = create<ChatStore>()((set) => ({
  ...INITIAL_STATE,
  upsertChat: (chat) =>
    set((state) => {
      const existing = state.chat_by_id[chat.id]

      return {
        chat_by_id: { ...state.chat_by_id, [chat.id]: existing ? mergeChat(existing, chat) : chat },
        chat_ids: existing ? state.chat_ids : [chat.id, ...state.chat_ids],
      }
    }),
  setActiveChat: (chat_id) => set({ active_chat_id: chat_id }),
  reset: () => set(INITIAL_STATE),
}))
