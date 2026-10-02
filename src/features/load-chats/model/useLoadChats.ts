import { queryOptions, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { instanceCredentials } from '@/shared/api'

import { fetchChats, readCachedContacts, useChatStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'

import { enrichMissingContacts } from '@/features/load-chats/model/enrich-contacts'

const CHATS_STALE_TIME_MS = 60_000

/**
 * Опции загрузки списка чатов.
 * queryFn намеренно не читает `signal`: в StrictMode снятие наблюдателя
 * отменяет in-flight запрос, если signal прочитан. Отмена и немедленный повтор
 * дают 429, а retry уходит третьим запросом. Без signal Query продолжает тот же promise.
 */
export function chatsQueryOptions(id_instance: string) {
  return queryOptions({
    queryKey: ['chats', id_instance],
    staleTime: CHATS_STALE_TIME_MS,
    queryFn: async () => {
      const session_id = instanceCredentials.getSessionId()
      const chats = await fetchChats()

      if (!instanceCredentials.isCurrentSession(session_id)) {
        return []
      }

      return chats
    },
  })
}

export function useLoadChats() {
  const id_instance = useSessionStore((state) =>
    state.session.status === 'authorized' ? state.session.id_instance : null,
  )
  const upsertChats = useChatStore((state) => state.upsertChats)

  const query = useQuery({
    ...chatsQueryOptions(id_instance ?? ''),
    enabled: id_instance !== null,
  })

  useEffect(() => {
    if (!query.data || !id_instance) {
      return
    }

    let is_cancelled = false
    const session_id = instanceCredentials.getSessionId()

    upsertChats(query.data)

    void (async () => {
      const cached = await readCachedContacts(id_instance)

      if (is_cancelled || !instanceCredentials.isCurrentSession(session_id)) {
        return
      }

      upsertChats(cached)
      await enrichMissingContacts(session_id, id_instance)
    })()

    return () => {
      is_cancelled = true
    }
  }, [id_instance, query.data, upsertChats])

  return query
}
