import { canUseChatCache, LAST_MESSAGES_STORE, openChatCache } from '@/entities/chat/api/chat-cache-db'

const FLUSH_INTERVAL_MS = 2_000

export type CachedLastMessage = {
  chat_id: string
  id: string
  text: string
  direction: 'incoming' | 'outgoing'
  timestamp: number
  is_deleted: boolean
  is_edited: boolean
}

type AccountQueue = {
  pending: Map<string, CachedLastMessage>
  flushed: Map<string, CachedLastMessage>
  timer: ReturnType<typeof setTimeout> | null
  last_flush_at: number
}

const queues = new Map<string, AccountQueue>()

function isCachedLastMessage(value: unknown): value is CachedLastMessage {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return (
    typeof record.chat_id === 'string' &&
    typeof record.id === 'string' &&
    typeof record.text === 'string' &&
    (record.direction === 'incoming' || record.direction === 'outgoing') &&
    typeof record.timestamp === 'number' &&
    typeof record.is_deleted === 'boolean' &&
    typeof record.is_edited === 'boolean'
  )
}

function sameMessage(left: CachedLastMessage, right: CachedLastMessage): boolean {
  return (
    left.id === right.id &&
    left.text === right.text &&
    left.direction === right.direction &&
    left.timestamp === right.timestamp &&
    left.is_deleted === right.is_deleted &&
    left.is_edited === right.is_edited
  )
}

function queueFor(account_id: string): AccountQueue {
  const existing = queues.get(account_id)

  if (existing) {
    return existing
  }

  const created: AccountQueue = { pending: new Map(), flushed: new Map(), timer: null, last_flush_at: 0 }
  queues.set(account_id, created)

  return created
}

async function writeMessages(account_id: string, messages: CachedLastMessage[]): Promise<void> {
  if (!canUseChatCache() || messages.length === 0) {
    return
  }

  const database = await openChatCache(account_id)

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(LAST_MESSAGES_STORE, 'readwrite')
    const store = transaction.objectStore(LAST_MESSAGES_STORE)

    for (const message of messages) {
      store.put(message)
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })

  database.close()
}

export function dropCachedLastMessages(account_id: string): void {
  const queue = queues.get(account_id)

  if (!queue) {
    return
  }

  if (queue.timer !== null) {
    clearTimeout(queue.timer)
  }

  queues.delete(account_id)
}

export async function flushCachedLastMessages(account_id: string): Promise<void> {
  const queue = queues.get(account_id)

  if (!queue) {
    return
  }

  if (queue.timer !== null) {
    clearTimeout(queue.timer)
    queue.timer = null
  }

  const messages = [...queue.pending.values()]
  queue.pending.clear()
  queue.last_flush_at = Date.now()

  if (messages.length === 0) {
    return
  }

  try {
    await writeMessages(account_id, messages)

    for (const message of messages) {
      queue.flushed.set(message.chat_id, message)
    }
  } catch {
    for (const message of messages) {
      if (!queue.pending.has(message.chat_id)) {
        queue.pending.set(message.chat_id, message)
      }
    }

    scheduleFlush(account_id)
  }
}

function scheduleFlush(account_id: string): void {
  const queue = queueFor(account_id)
  const elapsed = Date.now() - queue.last_flush_at

  if (elapsed >= FLUSH_INTERVAL_MS) {
    void flushCachedLastMessages(account_id)
    return
  }

  if (queue.timer !== null) {
    return
  }

  queue.timer = setTimeout(() => {
    queue.timer = null
    void flushCachedLastMessages(account_id)
  }, FLUSH_INTERVAL_MS - elapsed)
}

/** Кладёт последнее сообщение чата в очередь записи. Не чаще одного сброса за 2 с и при скрытии вкладки. */
export function rememberLastMessages(account_id: string, messages: CachedLastMessage[]): void {
  const queue = queueFor(account_id)
  let has_changes = false

  for (const message of messages) {
    const known = queue.pending.get(message.chat_id) ?? queue.flushed.get(message.chat_id)

    if (known && (sameMessage(known, message) || known.timestamp > message.timestamp)) {
      continue
    }

    queue.pending.set(message.chat_id, message)
    has_changes = true
  }

  if (has_changes) {
    scheduleFlush(account_id)
  }
}

export async function readCachedLastMessages(account_id: string): Promise<CachedLastMessage[]> {
  if (!canUseChatCache()) {
    return []
  }

  try {
    const database = await openChatCache(account_id)
    const messages = await new Promise<CachedLastMessage[]>((resolve, reject) => {
      const request = database.transaction(LAST_MESSAGES_STORE, 'readonly').objectStore(LAST_MESSAGES_STORE).getAll()

      request.onsuccess = () => {
        const rows: unknown[] = Array.isArray(request.result) ? request.result : []
        resolve(rows.filter(isCachedLastMessage))
      }
      request.onerror = () => reject(request.error)
    })

    database.close()

    return messages
  } catch {
    return []
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') {
      return
    }

    for (const account_id of queues.keys()) {
      void flushCachedLastMessages(account_id)
    }
  })
}
