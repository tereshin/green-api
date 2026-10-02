import { ApiError, captureSession } from '@/shared/api'

import { ensureContact, useChatStore, type Chat } from '@/entities/chat'

const CONTACT_FETCH_LIMIT = 2

/** Параллелизм ограничен; общий загрузчик дедуплицирует запросы с открытием чата. */
export async function enrichMissingContacts(): Promise<void> {
  const session = captureSession()
  const store = useChatStore.getState()
  const missing = store.chat_ids
    .map((chat_id) => store.chat_by_id[chat_id])
    .filter((chat): chat is Chat => chat !== undefined && !chat.has_contact_info)
  let index = 0
  let is_rate_limited = false

  async function next(): Promise<void> {
    while (session.isCurrent() && !is_rate_limited && index < missing.length) {
      const chat = missing[index++]
      if (!chat || useChatStore.getState().chat_by_id[chat.id]?.has_contact_info) continue
      try {
        await ensureContact(chat.id, chat.phone)
      } catch (error) {
        if (!session.isCurrent()) return
        if (error instanceof ApiError && error.status === 429) {
          is_rate_limited = true
        } else if (error instanceof ApiError && error.status === 400) {
          // Неподдерживаемый контакт пропускается только в памяти этой сессии.
          const current = useChatStore.getState().chat_by_id[chat.id] ?? chat
          useChatStore.getState().upsertChat({ ...current, has_contact_info: true })
        }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONTACT_FETCH_LIMIT, missing.length) }, () => next()))
}
