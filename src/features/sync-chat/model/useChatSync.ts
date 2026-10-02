import { useEffect } from 'react'

import { deleteNotification, receiveNotification, sessionEvents } from '@/shared/api'

import { useChatStore } from '@/entities/chat'
import { useMessageStore } from '@/entities/message'
import { useSessionStore } from '@/entities/session'

import {
  BACKOFF_BASE_MS,
  BACKOFF_MAX_MS,
  MAX_HANDLE_ATTEMPTS,
  RECEIVE_TIMEOUT_SECONDS,
} from '@/features/sync-chat/config/polling'
import { createNotificationPoller } from '@/features/sync-chat/lib/create-notification-poller'
import { sleep } from '@/features/sync-chat/lib/sleep'
import { handleNotification, type NotificationTargets } from '@/features/sync-chat/model/handle-notification'

const targets: NotificationTargets = {
  upsertChat: (chat) => useChatStore.getState().upsertChat(chat),
  upsertMessages: (messages) => useMessageStore.getState().upsertMessages(messages),
  setStatus: (message_id, status) => useMessageStore.getState().setStatus(message_id, status),
  expireSession: () => sessionEvents.emit('expired'),
}

/** Пока инстанс подключён, держит один long-polling цикл; смена инстанса или выход его останавливает. */
export function useChatSync(): void {
  const id_instance = useSessionStore((state) =>
    state.session.status === 'authorized' ? state.session.id_instance : null,
  )

  useEffect(() => {
    if (!id_instance) {
      return
    }

    const controller = new AbortController()
    const poller = createNotificationPoller({
      receive: (signal) => receiveNotification(RECEIVE_TIMEOUT_SECONDS, signal),
      ack: deleteNotification,
      handle: (body) => handleNotification(body, targets),
      sleep,
      onDropped: (receipt_id) => console.warn('Notification dropped after repeated handling failures', { receipt_id }),
      backoff_base_ms: BACKOFF_BASE_MS,
      backoff_max_ms: BACKOFF_MAX_MS,
      max_handle_attempts: MAX_HANDLE_ATTEMPTS,
    })

    void poller.run(controller.signal)

    return () => controller.abort()
  }, [id_instance])
}
