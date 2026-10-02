import { captureSession } from '@/shared/api'

import { fetchChatHistoryPage } from '@/entities/message/api/message-api'
import { HISTORY_PAGE_SIZE } from '@/entities/message/config'
import { useMessageStore } from '@/entities/message/model/useMessageStore'

const inflight_by_key = new Map<string, Promise<void>>()

/** Telegram GetChatHistory поддерживает count, без offset/cursor: расширяем окно и сливаем по id. */
function loadHistoryWindow(chat_id: string, count: number): Promise<void> {
  const session = captureSession()
  const key = `${session.session_id}:${chat_id}`
  const pending = inflight_by_key.get(key)
  if (pending) return pending

  const task = (async () => {
    const page = await fetchChatHistoryPage(chat_id, count)
    session.assertCurrent()
    const store = useMessageStore.getState()
    store.upsertMessages(page.messages)
    store.setHistoryPage(chat_id, {
      requested_count: count,
      received_count: page.received_count,
      latest_timestamp: page.latest_timestamp,
      has_more: page.received_count >= count,
    })
  })().finally(() => inflight_by_key.delete(key))
  inflight_by_key.set(key, task)
  return task
}

/** История хранится только в памяти; live-сообщение не заменяет её загрузку. */
export function ensureChatHistory(chat_id: string): Promise<void> {
  if (useMessageStore.getState().history_by_chat_id[chat_id]) return Promise.resolve()
  return loadHistoryWindow(chat_id, HISTORY_PAGE_SIZE)
}

export function loadOlderChatHistory(chat_id: string): Promise<void> {
  const store = useMessageStore.getState()
  const history = store.history_by_chat_id[chat_id]
  if (!history) return ensureChatHistory(chat_id)
  if (!history.has_more) return Promise.resolve()

  // Live-сообщения сдвигают серверное окно. Не даём им вытеснить запрошенную порцию истории.
  const newer_count = (store.message_ids_by_chat_id[chat_id] ?? []).filter((id) => {
    const message = store.message_by_id[id]
    return message && !id.startsWith('temp-') && message.timestamp > (history.latest_timestamp ?? 0)
  }).length
  return loadHistoryWindow(chat_id, history.requested_count + HISTORY_PAGE_SIZE + newer_count)
}
