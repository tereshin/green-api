import type { MessageStatus } from '@/entities/message/model/types'

const STATUS_RANK: Record<Exclude<MessageStatus, 'failed'>, number> = {
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
}

/**
 * Статус только растёт: ответ sendMessage или повторное уведомление не откатывают
 * delivered/read обратно в sent. failed применяется всегда; из failed выводит
 * только подтверждение сервера (не pending).
 */
export function mergeStatus(current: MessageStatus, next: MessageStatus): MessageStatus {
  if (next === 'failed') {
    return 'failed'
  }

  if (current === 'failed') {
    return next === 'pending' ? current : next
  }

  return STATUS_RANK[next] > STATUS_RANK[current] ? next : current
}
