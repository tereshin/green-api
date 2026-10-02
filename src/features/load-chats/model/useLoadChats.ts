import { queryOptions, useQuery } from '@tanstack/react-query'

import { captureSession } from '@/shared/api'

import { ensureChats, hydrateContactCache } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'

import { enrichMissingContacts } from '@/features/load-chats/model/enrich-contacts'

const CHATS_STALE_TIME_MS = 60_000

/**
 * Query хранит результат операции, а не вторую копию чатов.
 * Signal наблюдателя не читается: StrictMode переиспользует текущий запрос.
 * Смена сессии отменяет HTTP-запросы централизованно в shared/api.
 */
export function chatsQueryOptions(id_instance: string) {
  const session = captureSession()
  return queryOptions({
    queryKey: ['load-chats', id_instance, session.session_id],
    staleTime: CHATS_STALE_TIME_MS,
    queryFn: async () => {
      session.assertCurrent()
      await Promise.all([hydrateContactCache(), ensureChats()])
      session.assertCurrent()
      void enrichMissingContacts()
      return true as const
    },
  })
}

export function useLoadChats() {
  const id_instance = useSessionStore((state) =>
    state.session.status === 'authorized' ? state.session.id_instance : null,
  )
  return useQuery({
    ...chatsQueryOptions(id_instance ?? ''),
    enabled: id_instance !== null,
  })
}
