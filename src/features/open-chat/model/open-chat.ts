import { ApiError, captureSession, SessionChangedError, toPhoneChatId } from '@/shared/api'
import { normalizePhone } from '@/shared/lib/phone'

import { ensureContact, useChatStore } from '@/entities/chat'

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
}

function toOpenChatFailure(error: unknown): OpenChatFailure {
  if (error instanceof OpenChatError) {
    return error.failure
  }

  if (error instanceof SessionChangedError || (error instanceof DOMException && error.name === 'AbortError')) {
    return { reason: 'session_changed' }
  }

  if (error instanceof ApiError) {
    return CONTACT_NOT_FOUND_STATUSES.has(error.status)
      ? { reason: 'contact_not_found' }
      : { reason: 'request_failed', status: error.status }
  }

  return error instanceof TypeError ? { reason: 'network' } : { reason: 'request_failed', status: 0 }
}

export async function openChat(phone_input: string): Promise<OpenChatResult> {
  const phone = normalizePhone(phone_input)

  if (!phone) {
    throw new OpenChatError({ reason: 'invalid_phone' })
  }

  const session = captureSession()
  try {
    const chat = await ensureContact(toPhoneChatId(phone), phone)
    session.assertCurrent()
    // Только явное создание переписки пользователем может открыть новый диалог.
    useChatStore.getState().upsertChat(chat)
    // История загружается при переходе на маршрут; ошибка доступна для повтора в окне чата.
    return { chat_id: chat.id }
  } catch (error) {
    throw new OpenChatError(toOpenChatFailure(error))
  }
}
