import { create } from 'zustand'

import { mergeStatus } from '@/entities/message/model/message-status'
import type { Message, MessageStatus } from '@/entities/message/model/types'

/** Защита от неограниченного роста: статусы сообщений, которые так и не появились в сторе. */
const MAX_EARLY_STATUSES = 100

type MessagesState = {
  message_by_id: Record<string, Message>
  message_ids_by_chat_id: Record<string, string[]>
  /** Статус пришёл раньше самого сообщения (outgoingMessageStatus до ответа sendMessage). */
  early_status_by_id: Record<string, MessageStatus>
  /** getChatHistory уже запрашивали. Живое уведомление историю не заменяет. */
  history_loaded_chat_ids: Record<string, true>
}

type MessageStore = MessagesState & {
  upsertMessages: (messages: Message[]) => void
  /** Заменяет оптимистичное сообщение серверным; если серверное уже пришло уведомлением — сливает их. */
  confirmMessage: (temp_id: string, server_message: Message) => void
  setStatus: (message_id: string, status: MessageStatus) => void
  markFailed: (message_id: string) => void
  markHistoryLoaded: (chat_id: string) => void
  reset: () => void
}

const INITIAL_STATE: MessagesState = {
  message_by_id: {},
  message_ids_by_chat_id: {},
  early_status_by_id: {},
  history_loaded_chat_ids: {},
}

function mergeMessage(existing: Message | undefined, next: Message): Message {
  if (!existing) {
    return next
  }

  const flags = {
    is_deleted: existing.is_deleted || next.is_deleted,
    is_edited: existing.is_edited || next.is_edited,
  }

  if (existing.direction === 'outgoing' && next.direction === 'outgoing') {
    return { ...existing, ...next, ...flags, status: mergeStatus(existing.status, next.status) }
  }

  return { ...next, ...flags }
}

function withStatus(message: Message, status: MessageStatus): Message {
  return message.direction === 'outgoing' ? { ...message, status: mergeStatus(message.status, status) } : message
}

function compareByTimestamp(by_id: Record<string, Message>) {
  return (left_id: string, right_id: string): number => {
    const left = by_id[left_id]
    const right = by_id[right_id]
    const delta = (left?.timestamp ?? 0) - (right?.timestamp ?? 0)

    return delta !== 0 ? delta : left_id.localeCompare(right_id)
  }
}

function applyMessages(state: MessagesState, messages: Message[], removed_ids: string[] = []): MessagesState {
  const message_by_id = { ...state.message_by_id }
  const early_status_by_id = { ...state.early_status_by_id }
  const added_ids_by_chat_id = new Map<string, string[]>()

  const touchChat = (chat_id: string, message_id?: string) => {
    const added_ids = added_ids_by_chat_id.get(chat_id) ?? []

    if (message_id) {
      added_ids.push(message_id)
    }

    added_ids_by_chat_id.set(chat_id, added_ids)
  }

  for (const removed_id of removed_ids) {
    const removed = message_by_id[removed_id]

    if (removed) {
      delete message_by_id[removed_id]
      touchChat(removed.chat_id)
    }
  }

  for (const message of messages) {
    let merged = mergeMessage(message_by_id[message.id], message)
    const early_status = early_status_by_id[message.id]

    if (early_status) {
      merged = withStatus(merged, early_status)
      delete early_status_by_id[message.id]
    }

    message_by_id[message.id] = merged
    touchChat(merged.chat_id, merged.id)
  }

  const message_ids_by_chat_id = { ...state.message_ids_by_chat_id }

  for (const [chat_id, added_ids] of added_ids_by_chat_id) {
    const ids = new Set([...(message_ids_by_chat_id[chat_id] ?? []), ...added_ids])

    message_ids_by_chat_id[chat_id] = [...ids]
      .filter((id) => message_by_id[id]?.chat_id === chat_id)
      .sort(compareByTimestamp(message_by_id))
  }

  return { message_by_id, message_ids_by_chat_id, early_status_by_id, history_loaded_chat_ids: state.history_loaded_chat_ids }
}

export const useMessageStore = create<MessageStore>()((set) => ({
  ...INITIAL_STATE,
  upsertMessages: (messages) => set((state) => applyMessages(state, messages)),
  confirmMessage: (temp_id, server_message) =>
    set((state) => {
      const optimistic = state.message_by_id[temp_id]

      // Оптимистичного сообщения нет — стор сброшен (выход из сессии), подтверждать нечего.
      if (!optimistic) {
        return state
      }

      const existing = state.message_by_id[server_message.id]
      // Уже пришедшее уведомлением сообщение — источник серверных полей (timestamp, текст).
      const confirmed = existing ? mergeMessage(server_message, existing) : server_message

      return applyMessages(state, [confirmed], temp_id === server_message.id ? [] : [temp_id])
    }),
  setStatus: (message_id, status) =>
    set((state) => {
      const message = state.message_by_id[message_id]

      if (message) {
        return applyMessages(state, [withStatus(message, status)])
      }

      const early_status_by_id =
        Object.keys(state.early_status_by_id).length >= MAX_EARLY_STATUSES ? {} : { ...state.early_status_by_id }
      const previous = early_status_by_id[message_id]
      early_status_by_id[message_id] = previous ? mergeStatus(previous, status) : status

      return { early_status_by_id }
    }),
  markHistoryLoaded: (chat_id) =>
    set((state) => {
      if (state.history_loaded_chat_ids[chat_id]) {
        return state
      }

      return { history_loaded_chat_ids: { ...state.history_loaded_chat_ids, [chat_id]: true } }
    }),
  markFailed: (message_id) =>
    set((state) => {
      const message = state.message_by_id[message_id]

      return message ? applyMessages(state, [withStatus(message, 'failed')]) : state
    }),
  reset: () => set(INITIAL_STATE),
}))
