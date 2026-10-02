import { describe, expect, it } from 'vitest'

import { ApiError, MissingCredentialsError, SessionChangedError, shouldRetryRequest } from '@/shared/api'

describe('shouldRetryRequest', () => {
  it('retries transient failures at most twice', () => {
    expect(shouldRetryRequest(0, new TypeError('offline'))).toBe(true)
    expect(shouldRetryRequest(1, new ApiError(503, 'Unavailable'))).toBe(true)
    expect(shouldRetryRequest(2, new ApiError(503, 'Unavailable'))).toBe(false)
  })
  it('does not retry authentication, rate limits, cancellation or invalid response shapes', () => {
    for (const error of [
      new ApiError(401, 'Unauthorized'), new ApiError(429, 'Rate limited'),
      new MissingCredentialsError(), new SessionChangedError(),
      new DOMException('Cancelled', 'AbortError'), new SyntaxError('Invalid JSON'),
    ]) expect(shouldRetryRequest(0, error)).toBe(false)
  })
})
