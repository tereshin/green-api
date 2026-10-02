const SCHEMA_VERSION = 2

export const CONTACTS_STORE = 'contacts'
export const LAST_MESSAGES_STORE = 'last_messages'

function databaseName(account_id: string): string {
  return `chat-cache-${account_id}`
}

export function canUseChatCache(): boolean {
  return typeof indexedDB !== 'undefined'
}

/** Несовпадение версии очищает базу: старый снимок не мигрируется. */
export function openChatCache(account_id: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(account_id), SCHEMA_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      for (const store_name of [...database.objectStoreNames]) {
        database.deleteObjectStore(store_name)
      }

      database.createObjectStore(CONTACTS_STORE, { keyPath: 'id' })
      database.createObjectStore(LAST_MESSAGES_STORE, { keyPath: 'chat_id' })
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function deleteChatCache(account_id: string): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(databaseName(account_id))

    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => resolve()
  })
}
