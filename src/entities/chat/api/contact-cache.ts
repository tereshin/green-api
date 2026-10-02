import { cachedContactSchema, toChat, type CachedContact } from '@/entities/chat/api/contact-cache-schema'
import {
  CONTACT_CACHE_FLUSH_INTERVAL_MS,
  CONTACT_CACHE_TTL_MS,
  CONTACT_CACHE_VERSION,
  MAX_CACHED_CONTACTS,
} from '@/entities/chat/config/contact-cache'
import type { Chat } from '@/entities/chat/model/types'

const STORE_NAME = 'contacts'
type WriteQueue = {
  pending: Map<string, CachedContact>
  timer: ReturnType<typeof setTimeout> | null
  flushing: Promise<void> | null
}
const queues = new Map<string, WriteQueue>()
const databases = new Map<string, Set<IDBDatabase>>()

function databaseName(account_id: string): string {
  return `chat-cache-${account_id}`
}

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined'
}

function openDatabase(account_id: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(account_id), CONTACT_CACHE_VERSION)
    let is_abandoned = false
    request.onblocked = () => {
      is_abandoned = true
      reject(new DOMException('Contact cache upgrade is blocked', 'InvalidStateError'))
    }
    request.onupgradeneeded = () => {
      const database = request.result
      if (is_abandoned) {
        database.close()
        return
      }
      // Старые схемы, включая незавершённый кэш сообщений, полностью удаляются.
      for (const name of [...database.objectStoreNames]) database.deleteObjectStore(name)
      database.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => {
      const database = request.result
      if (is_abandoned) {
        database.close()
        return
      }
      const opened = databases.get(account_id) ?? new Set<IDBDatabase>()
      opened.add(database)
      databases.set(account_id, opened)
      database.onversionchange = () => database.close()
      resolve(database)
    }
    request.onerror = () => reject(request.error)
  })
}

async function withDatabase<T>(account_id: string, operation: (database: IDBDatabase) => Promise<T>): Promise<T> {
  const database = await openDatabase(account_id)
  try {
    return await operation(database)
  } finally {
    database.close()
    const opened = databases.get(account_id)
    opened?.delete(database)
    if (opened?.size === 0) databases.delete(account_id)
  }
}

/** Удаляет просроченные/повреждённые строки и ограничивает кэш последними контактами. */
function pruneContacts(store: IDBObjectStore, rows: unknown[]): CachedContact[] {
  const fresh: CachedContact[] = []
  const now = Date.now()
  for (const row of rows) {
    const parsed = cachedContactSchema.safeParse(row)
    if (parsed.success && parsed.data.cached_at <= now && now - parsed.data.cached_at < CONTACT_CACHE_TTL_MS) {
      fresh.push(parsed.data)
    } else if (typeof row === 'object' && row !== null && 'id' in row && typeof row.id === 'string') {
      store.delete(row.id)
    }
  }
  fresh.sort((left, right) => right.cached_at - left.cached_at)
  for (const row of fresh.slice(MAX_CACHED_CONTACTS)) store.delete(row.id)
  return fresh.slice(0, MAX_CACHED_CONTACTS)
}

export async function readCachedContacts(account_id: string): Promise<Chat[]> {
  if (!canUseIndexedDb()) return []
  try {
    return await withDatabase(account_id, (database) => new Promise<Chat[]>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()
      let contacts: Chat[] = []
      request.onsuccess = () => { contacts = pruneContacts(store, request.result).map(toChat) }
      transaction.oncomplete = () => resolve(contacts)
      transaction.onabort = () => reject(transaction.error)
      transaction.onerror = () => reject(transaction.error)
    }))
  } catch {
    // Заблокированная другой вкладкой очистка не должна задерживать сетевую загрузку.
    void deleteContactCache(account_id)
    return []
  }
}

export async function readCachedContact(account_id: string, chat_id: string): Promise<Chat | null> {
  return (await readCachedContacts(account_id)).find((contact) => contact.id === chat_id) ?? null
}

export async function flushCachedContacts(account_id: string): Promise<void> {
  const queue = queues.get(account_id)
  if (!queue) return
  while (queue.flushing) {
    await queue.flushing
    if (queues.get(account_id) !== queue) return
  }
  if (queue.timer !== null) clearTimeout(queue.timer)
  queue.timer = null
  const contacts = [...queue.pending.values()]
  queue.pending.clear()
  if (contacts.length === 0) return
  const task = withDatabase(account_id, (database) => {
    // Выход мог произойти, пока открывалась база. Старый снимок не записывается.
    if (queues.get(account_id) !== queue) return Promise.resolve()
    return new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      for (const contact of contacts) store.put(contact)
      const request = store.getAll()
      request.onsuccess = () => { pruneContacts(store, request.result) }
      transaction.oncomplete = () => resolve()
      transaction.onabort = () => reject(transaction.error)
      transaction.onerror = () => reject(transaction.error)
    })
  }).catch(() => {
    if (queues.get(account_id) === queue) void deleteContactCache(account_id)
  }).finally(() => {
    if (queue.flushing === task) queue.flushing = null
  })
  queue.flushing = task
  await task
}

/** Запись батчем; отсутствие IndexedDB не мешает работе приложения. */
export function writeCachedContacts(account_id: string, chats: Chat[]): void {
  if (!canUseIndexedDb()) return
  const queue = queues.get(account_id) ?? { pending: new Map<string, CachedContact>(), timer: null, flushing: null }
  for (const chat of chats) {
    const parsed = cachedContactSchema.safeParse({ ...chat, cached_at: Date.now() })
    if (parsed.success) {
      queue.pending.delete(chat.id)
      queue.pending.set(chat.id, parsed.data)
    }
  }
  while (queue.pending.size > MAX_CACHED_CONTACTS) queue.pending.delete(queue.pending.keys().next().value!)
  if (queue.pending.size === 0) return
  queues.set(account_id, queue)
  if (queue.timer === null) {
    queue.timer = setTimeout(() => { void flushCachedContacts(account_id) }, CONTACT_CACHE_FLUSH_INTERVAL_MS)
  }
}

export async function deleteContactCache(account_id: string): Promise<void> {
  const queue = queues.get(account_id)
  if (queue?.timer !== null && queue?.timer !== undefined) clearTimeout(queue.timer)
  queues.delete(account_id)
  for (const database of databases.get(account_id) ?? []) database.close()
  if (!canUseIndexedDb()) return
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName(account_id))
    request.onsuccess = () => resolve()
    request.onerror = () => resolve()
    request.onblocked = () => reject(new DOMException('Contact cache deletion is blocked', 'InvalidStateError'))
  }).catch(() => { /* Очистка остаётся в очереди IndexedDB; кэш не блокирует приложение. */ })
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      for (const account_id of queues.keys()) void flushCachedContacts(account_id)
    }
  })
}
