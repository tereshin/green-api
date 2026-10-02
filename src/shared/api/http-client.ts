import { env } from '@/shared/config/env'

import { ApiError } from '@/shared/api/api-error'
import { sessionEvents } from '@/shared/api/session-events'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
}

const CSRF_COOKIE_NAME = 'XSRF-TOKEN'
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN'

/**
 * CSRF-токен — единственная cookie, которую клиент читает намеренно.
 * Она не HttpOnly по дизайну (double-submit pattern) и не является секретом сессии.
 */
function getCsrfToken(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`))
  const raw_value = match?.[1]

  return raw_value ? decodeURIComponent(raw_value) : null
}

async function request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { method = 'GET', body, signal, headers = {} } = options
  const csrf_token = method === 'GET' ? null : getCsrfToken()

  const response = await fetch(`${env.api_base_url}${path}`, {
    method,
    signal,
    // Сессия живёт в HttpOnly cookie; браузер прикладывает её сам.
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(csrf_token ? { [CSRF_HEADER_NAME]: csrf_token } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401) {
    sessionEvents.emit('expired')
  }

  if (!response.ok) {
    throw await ApiError.fromResponse(response)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}

export const httpClient = {
  get: <TResponse>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<TResponse>(path, { ...options, method: 'GET' }),
  post: <TResponse>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<TResponse>(path, { ...options, method: 'POST', body }),
  put: <TResponse>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<TResponse>(path, { ...options, method: 'PUT', body }),
  patch: <TResponse>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<TResponse>(path, { ...options, method: 'PATCH', body }),
  delete: <TResponse>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<TResponse>(path, { ...options, method: 'DELETE' }),
}
