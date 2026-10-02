import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { sessionEvents } from '@/shared/api'

import { resetSession } from '@/app/model/reset-session'

export function useSessionLifecycle(): void {
  const query_client = useQueryClient()

  useEffect(() => {
    const handleSessionEnd = () => resetSession(query_client)
    const unsubscribe_expired = sessionEvents.on('expired', handleSessionEnd)
    const unsubscribe_disconnect = sessionEvents.on('disconnect_requested', handleSessionEnd)

    return () => {
      unsubscribe_expired()
      unsubscribe_disconnect()
    }
  }, [query_client])
}
