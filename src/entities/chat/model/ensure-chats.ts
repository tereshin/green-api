import { captureSession } from '@/shared/api'

import { fetchChats } from '@/entities/chat/api/chat-api'
import { useChatStore } from '@/entities/chat/model/useChatStore'

const CHATS_STALE_TIME_MS = 60_000
let list_task: { session_id: number; loaded_at: number | null; promise: Promise<void> } | null = null

/** Общий запрос для сайдбара и проверки прямой ссылки. Контакты из кэша не доказывают существование диалога. */
export function ensureChats(): Promise<void> {
  const session = captureSession()
  if (list_task?.session_id === session.session_id &&
    (list_task.loaded_at === null || Date.now() - list_task.loaded_at < CHATS_STALE_TIME_MS)) {
    return list_task.promise
  }

  const task: NonNullable<typeof list_task> = { session_id: session.session_id, loaded_at: null, promise: Promise.resolve() }
  task.promise = fetchChats().then((chats) => {
    session.assertCurrent()
    useChatStore.getState().upsertChats(chats)
    task.loaded_at = Date.now()
  }).catch((error: unknown) => {
    if (list_task === task) list_task = null
    throw error
  })
  list_task = task
  return task.promise
}

export async function hasChat(chat_id: string): Promise<boolean> {
  const session = captureSession()
  if (useChatStore.getState().chat_ids.includes(chat_id)) return true
  await ensureChats()
  session.assertCurrent()
  return useChatStore.getState().chat_ids.includes(chat_id)
}
