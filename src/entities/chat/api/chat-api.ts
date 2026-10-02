import { greenApiClient } from '@/shared/api'

import { contactInfoSchema, type ContactInfoDto } from '@/entities/chat/api/schemas'
import type { Chat } from '@/entities/chat/model/types'

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim()

  return trimmed ? trimmed : null
}

export function mapContactInfoToChat(dto: ContactInfoDto, fallback_phone: string | null = null): Chat {
  return {
    id: dto.chatId,
    phone: dto.phoneNumber ? String(dto.phoneNumber) : fallback_phone,
    title: nonEmpty(dto.contactName) ?? nonEmpty(dto.name),
    avatar_url: nonEmpty(dto.avatar),
  }
}

/** chat_id — канонический id или `<phone>@c.us`; в ответе всегда канонический. */
export async function fetchContactInfo(chat_id: string, fallback_phone: string | null = null, signal?: AbortSignal): Promise<Chat> {
  const response = await greenApiClient.post('getContactInfo', { chatId: chat_id }, contactInfoSchema, { signal })

  return mapContactInfoToChat(response, fallback_phone)
}
