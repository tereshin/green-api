import { z } from 'zod'

import { greenApiIdSchema } from '@/shared/api'

export const contactInfoSchema = z.looseObject({
  chatId: greenApiIdSchema,
  name: z.string().optional(),
  contactName: z.string().optional(),
  avatar: z.string().optional(),
  phoneNumber: z.number().optional(),
})

export type ContactInfoDto = z.infer<typeof contactInfoSchema>

export const chatListItemSchema = z.looseObject({
  chatId: greenApiIdSchema,
  name: z.string().optional(),
  type: z.string().optional(),
  phoneNumber: z.number().optional(),
})

export const chatListSchema = z.array(chatListItemSchema)

export const readChatResponseSchema = z.looseObject({
  setRead: z.boolean(),
})

export type ChatListItemDto = z.infer<typeof chatListItemSchema>
