import { ApiError, captureSession } from '@/shared/api'

import { ensureContact, hasChat } from '@/entities/chat'
import { ensureChatHistory } from '@/entities/message'

export type LoadChatResult = 'ready' | 'missing' | 'aborted' | 'contact_error' | 'history_error'

/** Контакт и история используют общие загрузчики; ошибки не маскируются пустой лентой. */
export async function loadChat(chat_id: string, signal?: AbortSignal): Promise<LoadChatResult> {
  const session = captureSession(signal)
  try {
    session.assertCurrent()
    const exists = await hasChat(chat_id)
    session.assertCurrent()
    if (!exists) return 'missing'
    await ensureContact(chat_id)
    session.assertCurrent()
  } catch (error) {
    if (!session.isCurrent()) return 'aborted'
    return error instanceof ApiError && (error.status === 400 || error.status === 404) ? 'missing' : 'contact_error'
  }

  try {
    await ensureChatHistory(chat_id)
    session.assertCurrent()
    return 'ready'
  } catch {
    return session.isCurrent() ? 'history_error' : 'aborted'
  }
}
