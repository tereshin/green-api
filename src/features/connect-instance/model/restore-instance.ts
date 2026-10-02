import { ApiError, instanceCredentials, MissingCredentialsError, sessionEvents } from '@/shared/api'

import { useSessionStore, type RestoreFailureReason } from '@/entities/session'

import { ConnectInstanceError, establishSession } from '@/features/connect-instance/model/connect-instance'

const CREDENTIAL_REJECT_STATUSES = new Set([401, 403, 404])

let restore_task: { session_id: number; promise: Promise<void> } | null = null

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function getRestoreFailureReason(error: unknown): RestoreFailureReason {
  if (error instanceof ApiError && error.status === 429) {
    return 'rate_limited'
  }

  if (error instanceof ConnectInstanceError && error.failure.reason === 'rate_limited') {
    return 'rate_limited'
  }

  if (error instanceof TypeError || (error instanceof ConnectInstanceError && error.failure.reason === 'network')) {
    return 'network'
  }

  return 'unknown'
}

function shouldForgetCredentials(error: unknown): boolean {
  if (error instanceof ConnectInstanceError) {
    return (
      error.failure.reason === 'invalid_credentials' ||
      error.failure.reason === 'instance_not_authorized' ||
      error.failure.reason === 'invalid_input'
    )
  }

  if (error instanceof ApiError) {
    return CREDENTIAL_REJECT_STATUSES.has(error.status)
  }

  return false
}

async function restoreInstanceOnce(): Promise<void> {
  if (!instanceCredentials.hasCredentials()) {
    if (useSessionStore.getState().session.status !== 'anonymous') {
      useSessionStore.getState().reset()
    }

    return
  }

  if (useSessionStore.getState().session.status === 'authorized') {
    return
  }

  useSessionStore.getState().beginRestore()
  const session_id = instanceCredentials.getSessionId()

  try {
    const established = await establishSession(session_id)

    if (!instanceCredentials.isCurrentSession(session_id)) {
      return
    }

    const id_instance = instanceCredentials.getIdInstance()

    if (!id_instance) {
      return
    }

    useSessionStore.getState().authorize({ id_instance, ...established })
  } catch (error) {
    if (isAbortError(error) || !instanceCredentials.isCurrentSession(session_id)) {
      return
    }

    if (error instanceof ConnectInstanceError && error.failure.reason === 'session_changed') {
      return
    }

    if (error instanceof MissingCredentialsError || shouldForgetCredentials(error)) {
      sessionEvents.emit('expired')
      // Вне AppRuntime (например, в тестах) подписчика жизненного цикла может не быть.
      if (instanceCredentials.isCurrentSession(session_id)) {
        instanceCredentials.clear()
        useSessionStore.getState().reset()
      }

      return
    }

    useSessionStore.getState().failRestore(getRestoreFailureReason(error))
  }
}

/**
 * Один запрос на восстановление. Повторный вызов (StrictMode) ждёт тот же promise:
 * отмена первого getAccountSettings и немедленный повтор дают 429.
 */
export function restoreInstance(): Promise<void> {
  const session_id = instanceCredentials.getSessionId()
  if (restore_task?.session_id === session_id) {
    return restore_task.promise
  }

  const promise = restoreInstanceOnce().finally(() => {
    if (restore_task?.promise === promise) restore_task = null
  })

  restore_task = { session_id, promise }
  return promise
}
