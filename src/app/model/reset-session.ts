import type { QueryClient } from '@tanstack/react-query'

import { instanceCredentials } from '@/shared/api'

import { deleteContactCache, useChatStore } from '@/entities/chat'
import { useMessageStore } from '@/entities/message'
import { useSessionStore } from '@/entities/session'

/**
 * Полный сброс данных сессии. Очистка credentials увеличивает session_id, поэтому
 * запросы, завершившиеся позже, отбрасывают свой результат. Поллер останавливается
 * через useChatSync, когда сессия переходит в anonymous.
 */
export function resetSession(query_client: QueryClient): void {
  const account_id = instanceCredentials.getIdInstance()

  // Сначала закрываем сессию: никакой завершившийся запрос уже не имеет права менять данные.
  instanceCredentials.clear()

  void query_client.cancelQueries()
  query_client.clear()

  if (account_id) {
    void deleteContactCache(account_id)
  }

  useSessionStore.getState().reset()
  useChatStore.getState().reset()
  useMessageStore.getState().reset()
}
