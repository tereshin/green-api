import { ApiError, instanceCredentials, toPhoneChatId } from '@/shared/api'
import { normalizePhone } from '@/shared/lib/phone'

import { fetchContactInfo, useChatStore } from '@/entities/chat'
import { fetchChatHistory, HISTORY_PAGE_SIZE, useMessageStore } from '@/entities/message'

const CONTACT_NOT_FOUND_STATUSES = new Set([400, 404])

export type OpenChatFailure =
  | { reason: 'invalid_phone' }
  | { reason: 'contact_not_found' }
  | { reason: 'session_changed' }
  | { reason: 'network' }
  | { reason: 'request_failed'; status: number }

export class OpenChatError extends Error {
  readonly failure: OpenChatFailure

  constructor(failure: OpenChatFailure) {
    super(`Opening chat failed: ${failure.reason}`)
    this.name = 'OpenChatError'
    this.failure = failure
  }
}

export type OpenChatResult = {
  chat_id: string
  is_history_loaded: boolean
}

function toOpenChatFailure(error: unknown): OpenChatFailure {
  if (error instanceof OpenChatError) {
    return error.failure
  }

  if (error instanceof ApiError) {
    return CONTACT_NOT_FOUND_STATUSES.has(error.status)
      ? { reason: 'contact_not_found' }
      : { reason: 'request_failed', status: error.status }
  }

  return error instanceof TypeError ? { reason: 'network' } : { reason: 'request_failed', status: 0 }
}

/** История — best effort: её ошибка не мешает открыть чат. */
async function loadHistory(chat_id: string, session_id: number): Promise<boolean> {
  try {
    const messages = await fetchChatHistory(chat_id, HISTORY_PAGE_SIZE)

    if (!instanceCredentials.isCurrentSession(session_id)) {
      return false
    }

    useMessageStore.getState().upsertMessages(messages)

    return true
  } catch {
    return false
  }
}

export async function openChat(phone_input: string): Promise<OpenChatResult> {
  const phone = normalizePhone(phone_input)

  if (!phone) {
    throw new OpenChatError({ reason: 'invalid_phone' })
  }

  const session_id = instanceCredentials.getSessionId()

  try {
    const chat = await fetchContactInfo(toPhoneChatId(phone), phone)

    if (!instanceCredentials.isCurrentSession(session_id)) {
      throw new OpenChatError({ reason: 'session_changed' })
    }

    const chat_store = useChatStore.getState()
    chat_store.upsertChat(chat)
    chat_store.setActiveChat(chat.id)

    return { chat_id: chat.id, is_history_loaded: await loadHistory(chat.id, session_id) }
  } catch (error) {
    throw new OpenChatError(toOpenChatFailure(error))
  }
}
