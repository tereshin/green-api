import { z } from 'zod'

export const AUTHORIZED_STATE = 'authorized'

export const instanceStateSchema = z.looseObject({
  stateInstance: z.string(),
})

export const instanceSettingsSchema = z.looseObject({
  webhookUrl: z.string().nullish(),
  incomingWebhook: z.string().optional(),
  outgoingAPIMessageWebhook: z.string().optional(),
})

/** Телефон и chatId в документации — строки, в примерах Apidog телефон приходит числом. */
const accountIdSchema = z.union([z.string(), z.number()])

export const accountSettingsSchema = z.looseObject({
  avatar: z.string().nullish(),
  phone: accountIdSchema.nullish(),
  stateInstance: z.string(),
  chatId: accountIdSchema.nullish(),
  username: z.string().nullish(),
  historySyncProgress: z.number().nullish(),
})

export type InstanceSettingsDto = z.infer<typeof instanceSettingsSchema>
export type AccountSettingsDto = z.infer<typeof accountSettingsSchema>
