import { useMemo } from 'react'

import type { Chat } from '@/entities/chat'
import { useChatStore } from '@/entities/chat'
import type { Message } from '@/entities/message'
import { useMessageStore } from '@/entities/message'

export type ChatListEntry = {
  chat: Chat
  last_message: Message | null
}

/** Чаты с последним сообщением; свежие сверху, новые чаты без сообщений — в порядке добавления. */
export function useChatListItems(): ChatListEntry[] {
  const chat_by_id = useChatStore((state) => state.chat_by_id)
  const chat_ids = useChatStore((state) => state.chat_ids)
  const message_by_id = useMessageStore((state) => state.message_by_id)
  const message_ids_by_chat_id = useMessageStore((state) => state.message_ids_by_chat_id)

  return useMemo(() => {
    const entries: ChatListEntry[] = []

    for (const chat_id of chat_ids) {
      const chat = chat_by_id[chat_id]

      if (!chat) {
        continue
      }

      const last_message_id = message_ids_by_chat_id[chat_id]?.at(-1)

      entries.push({ chat, last_message: last_message_id ? (message_by_id[last_message_id] ?? null) : null })
    }

    return entries
      .map((entry, index) => ({ entry, index }))
      .sort((left, right) => {
        const delta = (right.entry.last_message?.timestamp ?? Infinity) - (left.entry.last_message?.timestamp ?? Infinity)

        return Number.isNaN(delta) || delta === 0 ? left.index - right.index : delta
      })
      .map(({ entry }) => entry)
  }, [chat_by_id, chat_ids, message_by_id, message_ids_by_chat_id])
}
