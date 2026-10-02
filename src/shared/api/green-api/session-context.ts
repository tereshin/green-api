import { instanceCredentials } from '@/shared/api/green-api/credentials'

export class SessionChangedError extends Error {
  constructor() {
    super('The request belongs to a previous session')
    this.name = 'SessionChangedError'
  }
}

/** Снимок сессии для всей операции, включая промежутки между несколькими запросами. */
export function captureSession(signal?: AbortSignal) {
  const session_id = instanceCredentials.getSessionId()
  const account_id = instanceCredentials.getIdInstance()
  const session_signal = instanceCredentials.getSignal()
  const operation_signal = signal ? AbortSignal.any([signal, session_signal]) : session_signal
  const isCurrent = () => instanceCredentials.isCurrentSession(session_id) && !operation_signal.aborted

  return {
    session_id,
    account_id,
    signal: operation_signal,
    isCurrent,
    assertCurrent(): void {
      if (!instanceCredentials.isCurrentSession(session_id)) {
        throw new SessionChangedError()
      }

      operation_signal.throwIfAborted()
    },
  }
}
