import { ApiError } from '@/shared/api/api-error'
import { MissingCredentialsError } from '@/shared/api/green-api/client'
import { SessionChangedError } from '@/shared/api/green-api/session-context'

export function shouldRetryRequest(failure_count: number, error: unknown): boolean {
  if (failure_count >= 2 || error instanceof MissingCredentialsError || error instanceof SessionChangedError) return false
  if (error instanceof DOMException && error.name === 'AbortError') return false
  return error instanceof TypeError || (error instanceof ApiError && error.status >= 500)
}
