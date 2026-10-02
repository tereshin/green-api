import { clearStoredCredentials, persistCredentials, readStoredCredentials } from '@/shared/api/green-api/credential-storage'

import type { InstanceCredentials } from '@/shared/api/green-api/types'

export type { InstanceCredentials } from '@/shared/api/green-api/types'

let current_credentials: InstanceCredentials | null = null
let session_id = 0
let session_controller = new AbortController()

function advanceSession(): void {
  session_controller.abort()
  session_controller = new AbortController()
  session_id += 1
}

/**
 * Только для client.ts: не реэкспортируется из index.ts, чтобы токен
 * не был доступен остальному приложению как значение.
 */
export function readCredentials(): InstanceCredentials | null {
  return current_credentials
}

/** Подхватывает credentials, сохранённые в sessionStorage этой вкладки. */
export function hydrateInstanceCredentials(): void {
  const stored = readStoredCredentials()

  if (!stored) {
    return
  }

  current_credentials = stored
  advanceSession()
}

/**
 * Единственный владелец idInstance/apiTokenInstance.
 * Память модуля — рабочая копия, sessionStorage — снимок на время вкладки,
 * чтобы обновление страницы не требовало повторного входа.
 * Закрытие вкладки и clear() удаляют снимок. Токен наружу не экспортируется.
 *
 * session_id растёт при каждом set/clear/hydrate. Асинхронный код снимает его до запроса
 * и отбрасывает результат, если сессия сменилась (ответ пришёл после выхода).
 */
export const instanceCredentials = {
  set(credentials: InstanceCredentials): void {
    current_credentials = { ...credentials }
    advanceSession()
    persistCredentials(current_credentials)
  },
  clear(): void {
    current_credentials = null
    advanceSession()
    clearStoredCredentials()
  },
  hasCredentials: (): boolean => current_credentials !== null,
  getIdInstance: (): string | null => current_credentials?.id_instance ?? null,
  getSessionId: (): number => session_id,
  getSignal: (): AbortSignal => session_controller.signal,
  isCurrentSession: (expected_session_id: number): boolean => expected_session_id === session_id,
}

hydrateInstanceCredentials()
