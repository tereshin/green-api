import type { InstanceCredentials } from '@/shared/api/green-api/credentials'

/**
 * Сессия этого клиента — пара idInstance/apiTokenInstance, а BFF нет.
 * sessionStorage переживает обновление вкладки и очищается при её закрытии и при выходе.
 * localStorage не используем: ключ не должен жить дольше вкладки.
 * Имя ключа не содержит токен.
 */
const STORAGE_KEY = 'green-api.instance-credentials'

type KeyValueStorage = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function browserStorage(): KeyValueStorage | null {
  try {
    if (typeof sessionStorage === 'undefined') {
      return null
    }

    return sessionStorage
  } catch {
    return null
  }
}

function isStoredCredentials(value: unknown): value is InstanceCredentials {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const record = value as Record<string, unknown>
  const id_instance = typeof record.id_instance === 'string' ? record.id_instance.trim() : ''
  const api_token_instance = typeof record.api_token_instance === 'string' ? record.api_token_instance.trim() : ''

  return /^\d+$/.test(id_instance) && api_token_instance.length > 0
}

export function readStoredCredentials(storage: KeyValueStorage | null = browserStorage()): InstanceCredentials | null {
  if (!storage) {
    return null
  }

  const raw = storage.getItem(STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!isStoredCredentials(parsed)) {
      storage.removeItem(STORAGE_KEY)

      return null
    }

    return {
      id_instance: parsed.id_instance.trim(),
      api_token_instance: parsed.api_token_instance.trim(),
    }
  } catch {
    storage.removeItem(STORAGE_KEY)

    return null
  }
}

export function persistCredentials(
  credentials: InstanceCredentials,
  storage: KeyValueStorage | null = browserStorage(),
): void {
  if (!storage) {
    return
  }

  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        id_instance: credentials.id_instance,
        api_token_instance: credentials.api_token_instance,
      }),
    )
  } catch {
    // Приватный режим может запретить storage: сессия останется до обновления страницы.
  }
}

export function clearStoredCredentials(storage: KeyValueStorage | null = browserStorage()): void {
  if (!storage) {
    return
  }

  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // storage недоступен — в памяти credentials уже сброшены
  }
}
