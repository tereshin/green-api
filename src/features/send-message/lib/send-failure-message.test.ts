import { describe, expect, it } from 'vitest'

import { getSendFailureMessage } from '@/features/send-message/lib/send-failure-message'

describe('getSendFailureMessage', () => {
  it('describes quota errors', () => {
    expect(getSendFailureMessage({ reason: 'request_failed', status: 466 })).toMatch(/лимит/)
  })

  it('describes server errors', () => {
    expect(getSendFailureMessage({ reason: 'request_failed', status: 502 })).toMatch(/недоступен/)
  })

  it('includes max length', () => {
    expect(getSendFailureMessage({ reason: 'message_too_long', max_length: 4096 })).toMatch(/4096/)
  })
})
