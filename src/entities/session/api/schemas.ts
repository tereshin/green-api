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

export type InstanceSettingsDto = z.infer<typeof instanceSettingsSchema>
