import { captureSession } from '@/shared/api'

import { fetchContactInfo } from '@/entities/chat/api/chat-api'
import { readCachedContacts, writeCachedContacts } from '@/entities/chat/api/contact-cache'
import type { Chat } from '@/entities/chat/model/types'
import { useChatStore } from '@/entities/chat/model/useChatStore'

const inflight_by_key = new Map<string, Promise<Chat>>()
let hydration: { session_id: number; promise: Promise<void> } | null = null

/** Гидратация не зависит от успеха сети и не затирает уже известные серверные поля. */
export function hydrateContactCache(): Promise<void> {
  const session = captureSession()
  if (hydration?.session_id === session.session_id) return hydration.promise

  const promise = (async () => {
    if (!session.account_id) return
    const cached = await readCachedContacts(session.account_id)
    session.assertCurrent()
    const store = useChatStore.getState()
    store.upsertContacts(cached.filter((chat) => !store.chat_by_id[chat.id]))
  })()
  hydration = { session_id: session.session_id, promise }
  return promise
}

/** Один запрос на контакт в рамках сессии. Отмена потребителя не отменяет запрос остальных. */
export function ensureContact(chat_id: string, fallback_phone: string | null = null): Promise<Chat> {
  const session = captureSession()
  const chat_by_id = useChatStore.getState().chat_by_id
  const known = chat_by_id[chat_id] ?? (fallback_phone
    ? Object.values(chat_by_id).find((chat) => chat.phone === fallback_phone)
    : undefined)
  if (known?.has_contact_info) return Promise.resolve(known)

  const key = `${session.session_id}:${known?.id ?? chat_id}`
  const pending = inflight_by_key.get(key)
  if (pending) return pending

  const task = (async () => {
    const cached_contacts = session.account_id ? await readCachedContacts(session.account_id) : []
    const cached = cached_contacts.find((chat) => chat.id === chat_id || (fallback_phone !== null && chat.phone === fallback_phone))
    session.assertCurrent()
    const contact = cached ?? await fetchContactInfo(known?.id ?? chat_id, fallback_phone ?? known?.phone ?? null)
    session.assertCurrent()
    useChatStore.getState().upsertContacts([contact])
    if (!cached && session.account_id) writeCachedContacts(session.account_id, [contact])
    return contact
  })().finally(() => inflight_by_key.delete(key))
  inflight_by_key.set(key, task)
  return task
}
