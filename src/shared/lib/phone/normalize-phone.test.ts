import { describe, expect, it } from 'vitest'

import { normalizePhone } from '@/shared/lib/phone/normalize-phone'

describe('normalizePhone', () => {
  it('strips formatting characters', () => {
    expect(normalizePhone(' +7 (999) 123-45-67 ')).toBe('79991234567')
  })

  it('rejects too short and too long numbers', () => {
    expect(normalizePhone('123456789')).toBeNull()
    expect(normalizePhone('1234567890123456')).toBeNull()
  })

  it('rejects letters and other characters', () => {
    expect(normalizePhone('7999abc4567')).toBeNull()
    expect(normalizePhone('7999.123.45.67')).toBeNull()
  })

  it('does not rewrite national prefixes', () => {
    expect(normalizePhone('89991234567')).toBe('89991234567')
  })
})
