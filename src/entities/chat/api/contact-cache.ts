import type { Chat } from '@/entities/chat/model/types'

const SCHEMA_VERSION = 1
const STORE_NAME = 'contacts'

function databaseName(account_id: string): string {
  return `chat-cache-${account_id}`
}

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined'
}

function isCachedChat(value: unknown): value is Chat {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return typeof record.id === 'string' && record.has_contact_info === true
}

function openDatabase(account_id: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(account_id), SCHEMA_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function readCachedContacts(account_id: string): Promise<Chat[]> {
  if (!canUseIndexedDb()) {
    return []
  }

  try {
    const database = await openDatabase(account_id)
    const contacts = await new Promise<Chat[]>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly')
      const request = transaction.objectStore(STORE_NAME).getAll()

      request.onsuccess = () => {
        const rows: unknown[] = Array.isArray(request.result) ? request.result : []
        resolve(rows.filter(isCachedChat))
      }
      request.onerror = () => reject(request.error)
    })

    database.close()

    return contacts
  } catch {
    return []
  }
}

export async function readCachedContact(account_id: string, chat_id: string): Promise<Chat | null> {
  if (!canUseIndexedDb()) {
    return null
  }

  try {
    const database = await openDatabase(account_id)
    const contact = await new Promise<Chat | null>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(chat_id)

      request.onsuccess = () => resolve(isCachedChat(request.result) ? request.result : null)
      request.onerror = () => reject(request.error)
    })

    database.close()

    return contact
  } catch {
    return null
  }
}

export async function writeCachedContacts(account_id: string, chats: Chat[]): Promise<void> {
  const stored = chats.filter((chat) => chat.has_contact_info)

  if (!canUseIndexedDb() || stored.length === 0) {
    return
  }

  try {
    const database = await openDatabase(account_id)

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      for (const chat of stored) {
        store.put(chat)
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })

    database.close()
  } catch {
    // кэш можно потерять: следующий заход дочитает контакты с сервера
  }
}

export async function deleteContactCache(account_id: string): Promise<void> {
  if (!canUseIndexedDb()) {
    return
  }

  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(databaseName(account_id))

    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}
