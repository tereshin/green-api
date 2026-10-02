export type InstanceCredentials = {
  id_instance: string
  api_token_instance: string
}

let current_credentials: InstanceCredentials | null = null
let session_id = 0

/**
 * Только для client.ts: не реэкспортируется из index.ts, чтобы токен
 * не был доступен остальному приложению как значение.
 */
export function readCredentials(): InstanceCredentials | null {
  return current_credentials
}

/**
 * Единственный владелец idInstance/apiTokenInstance. Хранение — только память модуля:
 * перезагрузка страницы требует повторного ввода, это ожидаемо.
 *
 * session_id растёт при каждом set/clear. Асинхронный код снимает его до запроса
 * и отбрасывает результат, если сессия сменилась (ответ пришёл после выхода).
 */
export const instanceCredentials = {
  set(credentials: InstanceCredentials): void {
    current_credentials = { ...credentials }
    session_id += 1
  },
  clear(): void {
    current_credentials = null
    session_id += 1
  },
  hasCredentials: (): boolean => current_credentials !== null,
  getSessionId: (): number => session_id,
  isCurrentSession: (expected_session_id: number): boolean => expected_session_id === session_id,
}
