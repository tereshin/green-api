import type { CachedLastMessage } from '@/entities/chat'
import type { Message } from '@/entities/message'

type MessageSnapshot = {
  message_by_id: Record<string, Message>
  message_ids_by_chat_id: Record<string, string[]>
}

function toCachedLastMessage(message: Message): CachedLastMessage | null {
  if (message.id.startsWith('temp-')) {
    return null
  }

  if (message.direction === 'outgoing' && (message.status === 'pending' || message.status === 'failed')) {
    return null
  }

  return {
    chat_id: message.chat_id,
    id: message.id,
    text: message.text,
    direction: message.direction,
    timestamp: message.timestamp,
    is_deleted: message.is_deleted,
    is_edited: message.is_edited,
  }
}

/** Последнее подтверждённое сообщение каждого чата. Черновики pending/failed в кэш не попадают. */
export function snapshotLastMessages(state: MessageSnapshot): CachedLastMessage[] {
  const messages: CachedLastMessage[] = []

  for (const ids of Object.values(state.message_ids_by_chat_id)) {
    let latest: CachedLastMessage | null = null

    for (const id of ids) {
      const message = state.message_by_id[id]
      const cached = message ? toCachedLastMessage(message) : null

      if (!cached) {
        continue
      }

      if (!latest || cached.timestamp >= latest.timestamp) {
        latest = cached
      }
    }

    if (latest) {
      messages.push(latest)
    }
  }

  return messages
}
