import { ApiError, instanceCredentials } from '@/shared/api'

import { MAX_MESSAGE_LENGTH, sendTextMessage, useMessageStore, type OutgoingMessage } from '@/entities/message'

export type SendMessageInput = {
  chat_id: string
  text: string
}

export type SendMessageFailure =
  | { reason: 'empty_message' }
  | { reason: 'message_too_long'; max_length: number }
  | { reason: 'network' }
  | { reason: 'request_failed'; status: number }

export class SendMessageError extends Error {
  readonly failure: SendMessageFailure

  constructor(failure: SendMessageFailure) {
    super(`Sending message failed: ${failure.reason}`)
    this.name = 'SendMessageError'
    this.failure = failure
  }
}

export type SendMessageResult = {
  message_id: string
}

function toSendMessageFailure(error: unknown): SendMessageFailure {
  if (error instanceof ApiError) {
    return { reason: 'request_failed', status: error.status }
  }

  return error instanceof TypeError ? { reason: 'network' } : { reason: 'request_failed', status: 0 }
}

export async function sendMessage({ chat_id, text }: SendMessageInput): Promise<SendMessageResult> {
  const message_text = text.trim()

  if (message_text.length === 0) {
    throw new SendMessageError({ reason: 'empty_message' })
  }

  if (message_text.length > MAX_MESSAGE_LENGTH) {
    throw new SendMessageError({ reason: 'message_too_long', max_length: MAX_MESSAGE_LENGTH })
  }

  const session_id = instanceCredentials.getSessionId()
  const optimistic: OutgoingMessage = {
    id: `temp-${crypto.randomUUID()}`,
    chat_id,
    text: message_text,
    direction: 'outgoing',
    timestamp: Date.now(),
    status: 'pending',
  }

  useMessageStore.getState().upsertMessages([optimistic])

  try {
    const message_id = await sendTextMessage(chat_id, message_text)

    if (instanceCredentials.isCurrentSession(session_id)) {
      // confirmMessage сливает с уже пришедшим уведомлением и не откатывает delivered/read.
      useMessageStore.getState().confirmMessage(optimistic.id, { ...optimistic, id: message_id, status: 'sent' })
    }

    return { message_id }
  } catch (error) {
    if (instanceCredentials.isCurrentSession(session_id)) {
      useMessageStore.getState().markFailed(optimistic.id)
    }

    throw new SendMessageError(toSendMessageFailure(error))
  }
}
