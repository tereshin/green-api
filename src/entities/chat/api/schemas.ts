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
