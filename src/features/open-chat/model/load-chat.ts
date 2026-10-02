import { instanceCredentials } from '@/shared/api'

import { fetchContactInfo, readCachedContact, useChatStore, writeCachedContacts } from '@/entities/chat'
import { fetchChatHistory, HISTORY_PAGE_SIZE, useMessageStore } from '@/entities/message'

export type LoadChatResult = 'ready' | 'missing' | 'aborted'

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Открывает чат по id из адреса: контакт и история, если их ещё нет в памяти. */
export async function loadChat(chat_id: string, signal?: AbortSignal): Promise<LoadChatResult> {
  const session_id = instanceCredentials.getSessionId()

  try {
    const known = useChatStore.getState().chat_by_id[chat_id]

    if (!known?.has_contact_info) {
      const account_id = instanceCredentials.getIdInstance()
      const cached = account_id ? await readCachedContact(account_id, chat_id) : null

      if (signal?.aborted || !instanceCredentials.isCurrentSession(session_id)) {
        return 'aborted'
      }

      if (cached) {
        useChatStore.getState().upsertChat(cached)
      } else {
        const chat = await fetchContactInfo(chat_id, known?.phone ?? null, signal)

        if (signal?.aborted || !instanceCredentials.isCurrentSession(session_id)) {
          return 'aborted'
        }

        const stored = { ...chat, has_contact_info: true }
        useChatStore.getState().upsertChat(stored)

        if (account_id) {
          await writeCachedContacts(account_id, [stored])
        }
      }
    }
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) {
      return 'aborted'
    }

    return 'missing'
  }

  if (useMessageStore.getState().history_loaded_chat_ids[chat_id]) {
    return 'ready'
  }

  try {
    const messages = await fetchChatHistory(chat_id, HISTORY_PAGE_SIZE, signal)

    if (signal?.aborted || !instanceCredentials.isCurrentSession(session_id)) {
      return 'aborted'
    }

    useMessageStore.getState().upsertMessages(messages)
    useMessageStore.getState().markHistoryLoaded(chat_id)
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) {
      return 'aborted'
    }
  }

  return 'ready'
}
