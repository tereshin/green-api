import { greenApiClient } from '@/shared/api'

import { mapHistoryItemToMessage } from '@/entities/message/api/mappers'
import { chatHistorySchema, sendMessageResponseSchema } from '@/entities/message/api/schemas'
import type { Message } from '@/entities/message/model/types'

/** Возвращает idMessage, присвоенный сервером. */
export async function sendTextMessage(chat_id: string, text: string): Promise<string> {
  const response = await greenApiClient.post('sendMessage', { chatId: chat_id, message: text }, sendMessageResponseSchema)

  return response.idMessage
}

export async function fetchChatHistory(chat_id: string, count: number, signal?: AbortSignal): Promise<Message[]> {
  const items = await greenApiClient.post('getChatHistory', { chatId: chat_id, count }, chatHistorySchema, { signal })

  return items.map(mapHistoryItemToMessage).filter((message): message is Message => message !== null)
}
