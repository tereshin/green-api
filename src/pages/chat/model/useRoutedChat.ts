import { queryOptions, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { instanceCredentials } from '@/shared/api'

import { markChatRead } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'

import { loadChat } from '@/features/open-chat'

export function routedChatQueryOptions(chat_id: string | null, session_id: number | null) {
  return queryOptions({
    queryKey: ['load-chat', session_id, chat_id],
    queryFn: () => {
      if (!chat_id || session_id === null || !instanceCredentials.isCurrentSession(session_id)) {
        return Promise.resolve('aborted' as const)
      }
      return loadChat(chat_id)
    },
    enabled: chat_id !== null && session_id !== null,
    retry: false,
    staleTime: Infinity,
  })
}

/** Адрес — единственный источник выбранного чата. Query хранит только состояние загрузки. */
export function useRoutedChat(chat_id: string | null) {
  const session_id = useSessionStore((state) =>
    state.session.status === 'authorized' ? instanceCredentials.getSessionId() : null,
  )
  const query = useQuery(routedChatQueryOptions(chat_id, session_id))

  useEffect(() => {
    if (chat_id && session_id !== null && query.data === 'ready') void markChatRead(chat_id).catch(() => undefined)
  }, [chat_id, session_id, query.data])

  return {
    is_loading: chat_id !== null && (query.isPending || query.isFetching),
    is_missing: query.data === 'missing',
    load_error: query.data === 'history_error' ? 'history' as const :
      query.isError || query.data === 'contact_error' ? 'contact' as const : null,
    retry: () => { void query.refetch() },
  }
}
