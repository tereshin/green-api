import { z } from 'zod'

import { greenApiClient } from '@/shared/api/green-api/client'
import {
  notificationEnvelopeSchema,
  parseNotificationBody,
  type GreenApiNotificationBody,
} from '@/shared/api/green-api/notification-schemas'

export type GreenApiNotification = {
  receipt_id: number
  body: GreenApiNotificationBody
}

const deleteNotificationResponseSchema = z.looseObject({
  result: z.boolean(),
})

/** Long-polling: сервер держит запрос до receive_timeout_seconds и возвращает null, если очередь пуста. */
export async function receiveNotification(
  receive_timeout_seconds: number,
  signal?: AbortSignal,
): Promise<GreenApiNotification | null> {
  const envelope = await greenApiClient.get('receiveNotification', notificationEnvelopeSchema, {
    query: { receiveTimeout: String(receive_timeout_seconds) },
    signal,
  })

  if (!envelope) {
    return null
  }

  return { receipt_id: envelope.receiptId, body: parseNotificationBody(envelope.body) }
}

/** Возвращает false, если уведомление уже было удалено ранее. */
export async function deleteNotification(receipt_id: number, signal?: AbortSignal): Promise<boolean> {
  const response = await greenApiClient.delete('deleteNotification', deleteNotificationResponseSchema, {
    path_suffix: String(receipt_id),
    signal,
  })

  return response.result
}
