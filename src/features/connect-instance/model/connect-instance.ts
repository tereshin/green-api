import { ApiError, instanceCredentials, sessionEvents, type InstanceCredentials } from '@/shared/api'

import {
  AUTHORIZED_STATE,
  checkReceivingSettings,
  fetchInstanceSettings,
  fetchInstanceState,
  useSessionStore,
  type ReceivingIssue,
} from '@/entities/session'

const ID_INSTANCE_PATTERN = /^\d+$/
const INVALID_CREDENTIALS_STATUSES = new Set([401, 403, 404])

export type ConnectFailure =
  | { reason: 'invalid_input' }
  | { reason: 'invalid_credentials' }
  | { reason: 'instance_not_authorized'; state_instance: string }
  | { reason: 'session_changed' }
  | { reason: 'network' }
  | { reason: 'request_failed'; status: number }

export class ConnectInstanceError extends Error {
  readonly failure: ConnectFailure

  constructor(failure: ConnectFailure) {
    super(`Instance connection failed: ${failure.reason}`)
    this.name = 'ConnectInstanceError'
    this.failure = failure
  }
}

export type ConnectResult = {
  id_instance: string
  receiving_issues: ReceivingIssue[]
}

function toConnectFailure(error: unknown): ConnectFailure {
  if (error instanceof ConnectInstanceError) {
    return error.failure
  }

  if (error instanceof ApiError) {
    return INVALID_CREDENTIALS_STATUSES.has(error.status)
      ? { reason: 'invalid_credentials' }
      : { reason: 'request_failed', status: error.status }
  }

  return error instanceof TypeError ? { reason: 'network' } : { reason: 'request_failed', status: 0 }
}

export async function connectInstance(input: InstanceCredentials): Promise<ConnectResult> {
  const credentials: InstanceCredentials = {
    id_instance: input.id_instance.trim(),
    api_token_instance: input.api_token_instance.trim(),
  }

  if (!ID_INSTANCE_PATTERN.test(credentials.id_instance) || credentials.api_token_instance.length === 0) {
    throw new ConnectInstanceError({ reason: 'invalid_input' })
  }

  // Подключение поверх активной сессии = смена аккаунта: сначала полный сброс данных старого инстанса.
  if (instanceCredentials.hasCredentials()) {
    sessionEvents.emit('disconnect_requested')
  }

  instanceCredentials.set(credentials)
  const session_id = instanceCredentials.getSessionId()

  try {
    const state_instance = await fetchInstanceState()

    if (state_instance !== AUTHORIZED_STATE) {
      throw new ConnectInstanceError({ reason: 'instance_not_authorized', state_instance })
    }

    const receiving_issues = checkReceivingSettings(await fetchInstanceSettings())

    if (!instanceCredentials.isCurrentSession(session_id)) {
      throw new ConnectInstanceError({ reason: 'session_changed' })
    }

    const result = { id_instance: credentials.id_instance, receiving_issues }
    useSessionStore.getState().authorize(result)

    return result
  } catch (error) {
    if (instanceCredentials.isCurrentSession(session_id)) {
      instanceCredentials.clear()
    }

    throw new ConnectInstanceError(toConnectFailure(error))
  }
}
