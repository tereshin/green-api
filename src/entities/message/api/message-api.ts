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
  return (await fetchChatHistoryPage(chat_id, count, signal)).messages
}

/** count относится ко всем типам сообщений, а не только к поддерживаемому тексту. */
export async function fetchChatHistoryPage(chat_id: string, count: number, signal?: AbortSignal) {
  const items = await greenApiClient.post('getChatHistory', { chatId: chat_id, count }, chatHistorySchema, { signal })

  return {
    messages: items.map(mapHistoryItemToMessage).filter((message): message is Message => message !== null),
    received_count: items.length,
    latest_timestamp: items.length > 0 ? items.reduce((latest, item) => Math.max(latest, item.timestamp * 1_000), 0) : null,
  }
}
