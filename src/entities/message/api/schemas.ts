import { z } from 'zod'

import { greenApiIdSchema } from '@/shared/api'

export const sendMessageResponseSchema = z.looseObject({
  idMessage: greenApiIdSchema,
})

export const chatHistoryItemSchema = z.looseObject({
  type: z.string(),
  idMessage: greenApiIdSchema,
  timestamp: z.number(),
  typeMessage: z.string(),
  chatId: greenApiIdSchema,
  textMessage: z.string().optional(),
  statusMessage: z.string().optional(),
  isDeleted: z.boolean().optional(),
  isEdited: z.boolean().optional(),
})

export const chatHistorySchema = z.array(chatHistoryItemSchema)

export type ChatHistoryItemDto = z.infer<typeof chatHistoryItemSchema>
