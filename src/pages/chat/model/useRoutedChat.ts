import { useEffect, useState } from 'react'

import { markChatRead, useChatStore } from '@/entities/chat'
import { useMessageStore } from '@/entities/message'

import { loadChat } from '@/features/open-chat'

type LoadState = 'idle' | 'loading' | 'ready' | 'missing'

export function resolveChatLoadState(chat_id: string | null): LoadState {
  if (!chat_id) {
    return 'idle'
  }

  const has_chat = Boolean(useChatStore.getState().chat_by_id[chat_id])
  const has_history = Boolean(useMessageStore.getState().history_loaded_chat_ids[chat_id])

  return has_chat && has_history ? 'ready' : 'loading'
}

/** Адрес — источник правды: /chats и /chats/:chat_id синхронизируют открытый чат. */
export function useRoutedChat(chat_id: string | null): { is_loading: boolean; is_missing: boolean } {
  const setActiveChat = useChatStore((state) => state.setActiveChat)
  const [tracked_chat_id, setTrackedChatId] = useState(chat_id)
  const [load_state, setLoadState] = useState<LoadState>(() => resolveChatLoadState(chat_id))

  if (tracked_chat_id !== chat_id) {
    setTrackedChatId(chat_id)
    setLoadState(resolveChatLoadState(chat_id))
  }

  useEffect(() => {
    setActiveChat(chat_id)
  }, [chat_id, setActiveChat])

  useEffect(() => {
    if (!chat_id) {
      return
    }

    void markChatRead(chat_id).catch(() => undefined)
  }, [chat_id])

  useEffect(() => {
    if (!chat_id || resolveChatLoadState(chat_id) === 'ready') {
      return
    }

    const controller = new AbortController()

    void loadChat(chat_id, controller.signal).then((result) => {
      if (controller.signal.aborted || result === 'aborted') {
        return
      }

      setLoadState(result === 'missing' ? 'missing' : 'ready')
    })

    return () => controller.abort()
  }, [chat_id])

  return {
    is_loading: load_state === 'loading',
    is_missing: load_state === 'missing',
  }
}
