import { describe, expect, it } from 'vitest'

import { ApiError } from '@/shared/api'

import { getRestoreFailureReason } from '@/features/connect-instance/model/restore-instance'

describe('getRestoreFailureReason', () => {
  it('recognizes a rate limit separately from a dropped connection', () => {
    expect(getRestoreFailureReason(new ApiError(429, 'Too Many Requests'))).toBe('rate_limited')
    expect(getRestoreFailureReason(new TypeError('Failed to fetch'))).toBe('network')
    expect(getRestoreFailureReason(new ApiError(500, 'unavailable'))).toBe('unknown')
  })
})
