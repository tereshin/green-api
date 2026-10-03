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

  it.each([
    ['+7 937 999 48 33', '79379994833'],
    ['+381 94 888 33 44', '381948883344'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each([
    '--0349320948-4092840-', '09379994833', '+0 937 999 48 33',
    '++79379994833', '7+9379994833', '-79379994833', '79379994833-',
    '+7--9379994833', '+7 (9379994833', '+7 9379994833)',
  ])('rejects malformed phone %s before API calls', (input) => {
    expect(normalizePhone(input)).toBeNull()
  })
})
