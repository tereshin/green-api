import { create } from 'zustand'

import type { Chat } from '@/entities/chat/model/types'

type ChatStore = {
  chat_by_id: Record<string, Chat>
  chat_ids: string[]
  upsertChat: (chat: Chat) => void
  upsertChats: (chats: Chat[]) => void
  upsertContacts: (contacts: Chat[]) => void
  reset: () => void
}

const INITIAL_STATE = {
  chat_by_id: {},
  chat_ids: [],
} satisfies Pick<ChatStore, 'chat_by_id' | 'chat_ids'>

/** Пустые поля нового снимка не затирают уже известные значения (уведомления беднее getContactInfo). */
function mergeChat(existing: Chat, next: Chat): Chat {
  return {
    id: existing.id,
    phone: next.phone ?? existing.phone,
    title: next.title ?? existing.title,
    avatar_url: next.avatar_url ?? existing.avatar_url,
    has_contact_info: existing.has_contact_info || next.has_contact_info,
  }
}

export const useChatStore = create<ChatStore>()((set) => ({
  ...INITIAL_STATE,
  upsertChat: (chat) =>
    set((state) => {
      const existing = state.chat_by_id[chat.id]

      return {
        chat_by_id: { ...state.chat_by_id, [chat.id]: existing ? mergeChat(existing, chat) : chat },
        chat_ids: state.chat_ids.includes(chat.id) ? state.chat_ids : [chat.id, ...state.chat_ids],
      }
    }),
  upsertChats: (chats) =>
    set((state) => {
      const chat_by_id = { ...state.chat_by_id }
      const chat_ids = [...state.chat_ids]
      const known_ids = new Set(chat_ids)

      for (const chat of chats) {
        const existing = chat_by_id[chat.id]
        chat_by_id[chat.id] = existing ? mergeChat(existing, chat) : chat

        if (!known_ids.has(chat.id)) {
          known_ids.add(chat.id)
          chat_ids.push(chat.id)
        }
      }

      return { chat_by_id, chat_ids }
    }),
  // Контакт сам по себе не является диалогом и не должен попадать в сайдбар.
  upsertContacts: (contacts) =>
    set((state) => {
      const chat_by_id = { ...state.chat_by_id }
      for (const contact of contacts) {
        const existing = chat_by_id[contact.id]
        chat_by_id[contact.id] = existing ? mergeChat(existing, contact) : contact
      }
      return { chat_by_id }
    }),
  reset: () => set(INITIAL_STATE),
}))
