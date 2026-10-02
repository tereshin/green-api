import { ApiError, instanceCredentials } from '@/shared/api'

import { fetchContactInfo, useChatStore, writeCachedContacts, type Chat } from '@/entities/chat'

const CONTACT_FETCH_LIMIT = 2

const inflight_by_id = new Map<string, Promise<Chat | null>>()

async function loadContact(chat: Chat, session_id: number): Promise<Chat | null> {
  const pending = inflight_by_id.get(chat.id)

  if (pending) {
    return pending
  }

  const task = fetchContactInfo(chat.id, chat.phone)
    .then((contact) => {
      if (!instanceCredentials.isCurrentSession(session_id)) {
        return null
      }

      const stored = { ...contact, has_contact_info: true }
      useChatStore.getState().upsertChat(stored)

      return stored
    })
    .catch((error: unknown) => {
      if (!instanceCredentials.isCurrentSession(session_id)) {
        return null
      }

      if (error instanceof ApiError && error.status === 400) {
        const current = useChatStore.getState().chat_by_id[chat.id] ?? chat
        const stored = { ...current, has_contact_info: true }
        useChatStore.getState().upsertChat(stored)

        return stored
      }

      throw error
    })
    .finally(() => {
      inflight_by_id.delete(chat.id)
    })

  inflight_by_id.set(chat.id, task)

  return task
}

/** Догружает GetContactInfo только для chatId, которых ещё нет в кэше контактов. */
export async function enrichMissingContacts(session_id: number, account_id: string): Promise<void> {
  const missing = useChatStore
    .getState()
    .chat_ids.map((chat_id) => useChatStore.getState().chat_by_id[chat_id])
    .filter((chat): chat is Chat => chat !== undefined && !chat.has_contact_info)

  const stored: Chat[] = []
  let index = 0
  let is_rate_limited = false

  async function next(): Promise<void> {
    while (!is_rate_limited && index < missing.length) {
      const chat = missing[index]
      index += 1

      if (!chat || !instanceCredentials.isCurrentSession(session_id)) {
        return
      }

      if (useChatStore.getState().chat_by_id[chat.id]?.has_contact_info) {
        continue
      }

      try {
        const contact = await loadContact(chat, session_id)

        if (contact) {
          stored.push(contact)
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          is_rate_limited = true

          return
        }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONTACT_FETCH_LIMIT, missing.length) }, () => next()))

  if (instanceCredentials.isCurrentSession(session_id)) {
    await writeCachedContacts(account_id, stored)
  }
}
