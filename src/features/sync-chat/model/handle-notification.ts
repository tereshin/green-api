import type { GreenApiNotificationBody } from '@/shared/api'

import { mapSenderDataToChat, type Chat } from '@/entities/chat'
import { mapNotificationToMessage, mapStatusWebhookToStatus, type Message, type MessageStatus } from '@/entities/message'

import type { HandleResult } from '@/shared/lib/async'

export type NotificationTargets = {
  upsertChat: (chat: Chat) => void
  upsertMessages: (messages: Message[]) => void
  setStatus: (message_id: string, status: MessageStatus) => void
  expireSession: () => void
}

/** Переходные состояния (starting, sleepMode) не завершают сессию. */
const SESSION_ENDING_STATES = new Set(['notAuthorized', 'blocked'])

const HANDLED: HandleResult = { status: 'handled' }
const SKIPPED: HandleResult = { status: 'skipped' }

/**
 * Роутер уведомлений по сущностям. Все записи идемпотентны: upsert по idMessage/chatId
 * и монотонный статус, поэтому повторная доставка того же уведомления безопасна.
 */
export function handleNotification(body: GreenApiNotificationBody, targets: NotificationTargets): HandleResult {
  switch (body.typeWebhook) {
    case 'incomingMessageReceived':
    case 'outgoingAPIMessageReceived':
    case 'outgoingMessageReceived': {
      const message = mapNotificationToMessage(body)

      if (!message) {
        return SKIPPED
      }

      targets.upsertChat(mapSenderDataToChat(body.senderData, message.direction))
      targets.upsertMessages([message])

      return HANDLED
    }
    case 'outgoingMessageStatus': {
      const status = mapStatusWebhookToStatus(body.status)

      if (!status) {
        return SKIPPED
      }

      targets.setStatus(body.idMessage, status)

      return HANDLED
    }
    case 'stateInstanceChanged':
      if (!SESSION_ENDING_STATES.has(body.stateInstance)) {
        return SKIPPED
      }

      return { status: 'handled', after_ack: targets.expireSession }
    case 'unsupported':
      return SKIPPED
  }
}
