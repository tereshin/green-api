import { z } from 'zod'

import { greenApiIdSchema } from '@/shared/api/green-api/schema-primitives'

const senderDataSchema = z.looseObject({
  chatId: greenApiIdSchema,
  sender: greenApiIdSchema.optional(),
  chatName: z.string().optional(),
  senderName: z.string().optional(),
  senderContactName: z.string().optional(),
  senderPhoneNumber: z.number().optional(),
})

const messageDataSchema = z.looseObject({
  typeMessage: z.string(),
  textMessageData: z.looseObject({ textMessage: z.string() }).optional(),
  extendedTextMessageData: z.looseObject({ text: z.string() }).optional(),
})

const messageNotificationFields = {
  timestamp: z.number(),
  idMessage: greenApiIdSchema,
  senderData: senderDataSchema,
  messageData: messageDataSchema,
}

const incomingMessageReceivedSchema = z.looseObject({
  typeWebhook: z.literal('incomingMessageReceived'),
  ...messageNotificationFields,
})

const outgoingApiMessageReceivedSchema = z.looseObject({
  typeWebhook: z.literal('outgoingAPIMessageReceived'),
  ...messageNotificationFields,
})

const outgoingMessageReceivedSchema = z.looseObject({
  typeWebhook: z.literal('outgoingMessageReceived'),
  ...messageNotificationFields,
})

const outgoingMessageStatusSchema = z.looseObject({
  typeWebhook: z.literal('outgoingMessageStatus'),
  timestamp: z.number(),
  idMessage: greenApiIdSchema,
  chatId: greenApiIdSchema,
  status: z.string(),
})

const stateInstanceChangedSchema = z.looseObject({
  typeWebhook: z.literal('stateInstanceChanged'),
  timestamp: z.number(),
  stateInstance: z.string(),
})

const knownNotificationBodySchema = z.discriminatedUnion('typeWebhook', [
  incomingMessageReceivedSchema,
  outgoingApiMessageReceivedSchema,
  outgoingMessageReceivedSchema,
  outgoingMessageStatusSchema,
  stateInstanceChangedSchema,
])

export const notificationEnvelopeSchema = z
  .object({
    receiptId: z.number(),
    body: z.unknown(),
  })
  .nullable()

export type GreenApiSenderData = z.infer<typeof senderDataSchema>
export type GreenApiMessageData = z.infer<typeof messageDataSchema>
export type GreenApiMessageNotification =
  | z.infer<typeof incomingMessageReceivedSchema>
  | z.infer<typeof outgoingApiMessageReceivedSchema>
  | z.infer<typeof outgoingMessageReceivedSchema>
export type GreenApiOutgoingMessageStatus = z.infer<typeof outgoingMessageStatusSchema>

/** Тип не поддерживается приложением или известный тип пришёл в неожиданном формате. */
export type UnsupportedNotificationBody = {
  typeWebhook: 'unsupported'
  source_type: string
}

export type GreenApiNotificationBody = z.infer<typeof knownNotificationBodySchema> | UnsupportedNotificationBody

/**
 * Неизвестные и некорректные уведомления не бросают ошибку: повторная доставка
 * их не исправит, поэтому они помечаются как unsupported и пропускаются потребителем.
 */
export function parseNotificationBody(raw_body: unknown): GreenApiNotificationBody {
  const parsed = knownNotificationBodySchema.safeParse(raw_body)

  if (parsed.success) {
    return parsed.data
  }

  const source_type =
    typeof raw_body === 'object' && raw_body !== null && 'typeWebhook' in raw_body && typeof raw_body.typeWebhook === 'string'
      ? raw_body.typeWebhook
      : 'unknown'

  return { typeWebhook: 'unsupported', source_type }
}
