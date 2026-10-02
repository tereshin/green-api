/**
 * Единственная точка доступа к переменным окружения.
 *
 * ВАЖНО: всё с префиксом VITE_ попадает в клиентский бандл и является ПУБЛИЧНЫМ.
 * Сюда нельзя класть секреты (API-ключи с правами записи, токены, пароли).
 * Секреты живут только на бэкенде / BFF.
 */

function requireEnv(name: `VITE_${string}`): string {
  const value = import.meta.env[name]

  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required env variable: ${name}`)
  }

  return value
}

export const env = {
  /** Базовый URL BFF/бэкенда, через который идут все запросы. */
  api_base_url: requireEnv('VITE_API_BASE_URL'),
  /** Режим сборки. */
  mode: import.meta.env.MODE,
  is_dev: import.meta.env.DEV,
  is_prod: import.meta.env.PROD,
} as const
