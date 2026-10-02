import { useEffect } from 'react'

import {
  ApiError,
  captureSession,
  deleteNotification,
  instanceCredentials,
  MissingCredentialsError,
  receiveNotification,
  sessionEvents,
  SessionChangedError,
} from '@/shared/api'
import { createNotificationPoller, sleep } from '@/shared/lib/async'

import { useChatStore } from '@/entities/chat'
import { useMessageStore } from '@/entities/message'
import { useSessionStore } from '@/entities/session'

import {
  BACKOFF_BASE_MS,
  BACKOFF_MAX_MS,
  MAX_HANDLE_ATTEMPTS,
  RECEIVE_TIMEOUT_SECONDS,
} from '@/features/sync-chat/config/polling'
import { handleNotification, type NotificationTargets } from '@/features/sync-chat/model/handle-notification'

const targets: NotificationTargets = {
  upsertChat: (chat) => useChatStore.getState().upsertChat(chat),
  upsertMessages: (messages) => useMessageStore.getState().upsertMessages(messages),
  setStatus: (message_id, status) => useMessageStore.getState().setStatus(message_id, status),
  expireSession: () => sessionEvents.emit('expired'),
}

/** Пока инстанс подключён, держит один long-polling цикл; смена инстанса или выход его останавливает. */
export function useChatSync(): void {
  const session_id = useSessionStore((state) =>
    state.session.status === 'authorized' ? instanceCredentials.getSessionId() : null,
  )

  useEffect(() => {
    if (session_id === null) {
      return
    }

    const controller = new AbortController()
    const session = captureSession(controller.signal)
    const poller = createNotificationPoller({
      receive: (signal) => {
        session.assertCurrent()
        return receiveNotification(RECEIVE_TIMEOUT_SECONDS, signal)
      },
      ack: (receipt_id, signal) => {
        session.assertCurrent()
        return deleteNotification(receipt_id, signal)
      },
      handle: (body) => {
        session.assertCurrent()
        return handleNotification(body, targets)
      },
      sleep,
      isFatalError: (error) => error instanceof MissingCredentialsError || error instanceof SessionChangedError ||
        (error instanceof ApiError && error.status === 401),
      onDropped: (receipt_id) => console.warn('Notification dropped after repeated handling failures', { receipt_id }),
      backoff_base_ms: BACKOFF_BASE_MS,
      backoff_max_ms: BACKOFF_MAX_MS,
      max_handle_attempts: MAX_HANDLE_ATTEMPTS,
    })

    void poller.run(session.signal)

    return () => controller.abort()
  }, [session_id])
}
