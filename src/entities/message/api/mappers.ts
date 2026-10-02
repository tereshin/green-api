import type { GreenApiMessageData, GreenApiMessageNotification } from '@/shared/api'

import type { ChatHistoryItemDto } from '@/entities/message/api/schemas'
import type { Message, MessageStatus } from '@/entities/message/model/types'

const TEXT_MESSAGE_TYPES = new Set(['textMessage', 'extendedTextMessage'])

const STATUS_BY_WEBHOOK_STATUS: Record<string, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  noAccount: 'failed',
  notInGroup: 'failed',
  yellowCard: 'failed',
}

function toMilliseconds(timestamp_seconds: number): number {
  return timestamp_seconds * 1000
}

/** Неизвестный статус → null: лучше не менять статус, чем показать неверный. */
export function mapStatusWebhookToStatus(status: string | undefined): MessageStatus | null {
  return status ? (STATUS_BY_WEBHOOK_STATUS[status] ?? null) : null
}

function readText(message_data: GreenApiMessageData): string | null {
  if (!TEXT_MESSAGE_TYPES.has(message_data.typeMessage)) {
    return null
  }

  return message_data.textMessageData?.textMessage ?? message_data.extendedTextMessageData?.text ?? null
}

/** Нетекстовые сообщения не поддерживаются этапом и возвращают null. Удалённые показываем без текста. */
export function mapHistoryItemToMessage(dto: ChatHistoryItemDto): Message | null {
  const is_deleted = dto.isDeleted === true
  const is_edited = dto.isEdited === true

  if (!is_deleted && (!TEXT_MESSAGE_TYPES.has(dto.typeMessage) || dto.textMessage === undefined)) {
    return null
  }

  const base = {
    id: dto.idMessage,
    chat_id: dto.chatId,
    text: dto.textMessage ?? '',
    timestamp: toMilliseconds(dto.timestamp),
    is_deleted,
    is_edited,
  }

  if (dto.type === 'outgoing') {
    return { ...base, direction: 'outgoing', status: mapStatusWebhookToStatus(dto.statusMessage) ?? 'sent' }
  }

  return { ...base, direction: 'incoming' }
}

export function mapNotificationToMessage(notification: GreenApiMessageNotification): Message | null {
  const text = readText(notification.messageData)

  if (text === null) {
    return null
  }

  const base = {
    id: notification.idMessage,
    chat_id: notification.senderData.chatId,
    text,
    timestamp: toMilliseconds(notification.timestamp),
    is_deleted: false,
    is_edited: false,
  }

  if (notification.typeWebhook === 'incomingMessageReceived') {
    return { ...base, direction: 'incoming' }
  }

  return { ...base, direction: 'outgoing', status: 'sent' }
}
