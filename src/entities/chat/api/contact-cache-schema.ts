import { z } from 'zod'

import type { Chat } from '@/entities/chat/model/types'

export const cachedContactSchema = z.object({
  id: z.string().min(1),
  phone: z.string().nullable(),
  title: z.string().nullable(),
  avatar_url: z.string().nullable(),
  has_contact_info: z.literal(true),
  cached_at: z.number().finite().nonnegative(),
})

export type CachedContact = z.infer<typeof cachedContactSchema>

export function toChat({ cached_at: _cached_at, ...chat }: CachedContact): Chat {
  return chat
}
