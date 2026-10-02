import type { GreenApiSenderData } from '@/shared/api'

import type { Chat } from '@/entities/chat/model/types'

type NotificationDirection = 'incoming' | 'outgoing'

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim()

  return trimmed ? trimmed : null
}

/**
 * В исходящих уведомлениях senderData описывает наш аккаунт, а в группах отправитель ≠ чат,
 * поэтому телефон берётся только из входящего личного сообщения.
 */
export function mapSenderDataToChat(sender_data: GreenApiSenderData, direction: NotificationDirection): Chat {
  const is_private_incoming = direction === 'incoming' && sender_data.sender === sender_data.chatId
  const phone_number = sender_data.senderPhoneNumber

  return {
    id: sender_data.chatId,
    phone: is_private_incoming && phone_number ? String(phone_number) : null,
    title:
      nonEmpty(sender_data.chatName) ??
      (is_private_incoming ? (nonEmpty(sender_data.senderContactName) ?? nonEmpty(sender_data.senderName)) : null),
    avatar_url: null,
  }
}
