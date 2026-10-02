import { greenApiClient, instanceCredentials } from '@/shared/api'

import {
  chatListSchema,
  contactInfoSchema,
  readChatResponseSchema,
  type ChatListItemDto,
  type ContactInfoDto,
} from '@/entities/chat/api/schemas'
import type { Chat } from '@/entities/chat/model/types'

const GROUP_CHAT_TYPES = new Set(['group', 'supergroup', 'channel'])

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
    has_contact_info: true,
  }
}

/** chat_id — канонический id или `<phone>@c.us`; в ответе всегда канонический. */
export async function fetchContactInfo(chat_id: string, fallback_phone: string | null = null, signal?: AbortSignal): Promise<Chat> {
  const response = await greenApiClient.post('getContactInfo', { chatId: chat_id }, contactInfoSchema, { signal })

  return mapContactInfoToChat(response, fallback_phone)
}

export function mapChatListItem(dto: ChatListItemDto): Chat {
  return {
    id: dto.chatId,
    phone: dto.phoneNumber && dto.phoneNumber !== 0 ? String(dto.phoneNumber) : null,
    title: nonEmpty(dto.name),
    avatar_url: null,
    has_contact_info: dto.type ? GROUP_CHAT_TYPES.has(dto.type) : false,
  }
}

export async function fetchChats(signal?: AbortSignal): Promise<Chat[]> {
  const response = await greenApiClient.get('getChats', chatListSchema, { signal })

  return response.map(mapChatListItem)
}

const read_chat_tasks = new Map<string, Promise<boolean>>()

/** Отмечает входящие чата прочитанными. Повторный вызов того же чата ждёт уже идущий запрос. */
export function markChatRead(chat_id: string): Promise<boolean> {
  const session_id = instanceCredentials.getSessionId()
  const key = `${session_id}:${chat_id}`
  const pending = read_chat_tasks.get(key)
  if (pending) return pending

  const promise = greenApiClient
    .post('readChat', { chatId: chat_id }, readChatResponseSchema)
    .then((response) => response.setRead)
    .finally(() => {
      read_chat_tasks.delete(key)
    })

  read_chat_tasks.set(key, promise)

  return promise
}
