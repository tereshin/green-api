import { describe, expect, it } from 'vitest'

import { CALLING_CODES } from '@/features/open-chat/config/calling-codes'
import {
  applyPhoneMask,
  maskPhoneInput,
  MAX_PHONE_DIGITS,
  MAX_PHONE_INPUT_LENGTH,
} from '@/features/open-chat/lib/mask-phone-input'
import { validatePhone } from '@/features/open-chat/lib/new-chat-form-reducer'

describe('maskPhoneInput', () => {
  it('keeps the field empty until a plus or a digit appears', () => {
    expect(maskPhoneInput('')).toBe('')
    expect(maskPhoneInput('abc')).toBe('')
    expect(maskPhoneInput('+')).toBe('+')
  })

  it('always starts with a plus and groups a russian number by spaces', () => {
    expect(maskPhoneInput('79379994833')).toBe('+7 937 999 48 33')
    expect(maskPhoneInput('7+9379994833')).toBe('+7 937 999 48 33')
    expect(maskPhoneInput('++7 +937 999+ 48 33')).toBe('+7 937 999 48 33')
  })

  it('groups a 3-digit country code without splitting it', () => {
    expect(maskPhoneInput('38')).toBe('+38')
    expect(maskPhoneInput('381')).toBe('+381')
    expect(maskPhoneInput('+381 94 888 33 44')).toBe('+381 94 888 33 44')
    expect(maskPhoneInput('381948883344')).toBe('+381 94 888 33 44')
  })

  it.each(['+7 937 999 48 33', '+381 94 888 33 44'])('keeps an already masked number %s', (value) => {
    expect(maskPhoneInput(value)).toBe(value)
    expect(validatePhone(value)).toBeNull()
  })

  it('turns pasted separators into spaces and drops unrelated characters', () => {
    expect(maskPhoneInput('abc+7 (900) 123-45-67xyz')).toBe('+7 900 123 45 67')
  })

  it('drops dashes and rejects a number that starts with zero', () => {
    const value = maskPhoneInput('--0349320948-4092840-')
    expect(value.startsWith('+')).toBe(true)
    expect(value).not.toContain('-')
    expect(value.replace(/\D/g, '').length).toBeLessThanOrEqual(MAX_PHONE_DIGITS)
    expect(validatePhone(value)).not.toBeNull()
  })

  it('stops at 15 digits and fits the input length', () => {
    const masked = maskPhoneInput(`${'1'.repeat(MAX_PHONE_DIGITS)}999`)

    expect(masked.replace(/\D/g, '')).toHaveLength(MAX_PHONE_DIGITS)
    expect(masked).toBe('+1 111 111 11 11 11 11')
    expect(masked.length).toBe(MAX_PHONE_INPUT_LENGTH)
  })

  it('uses a prefix-free calling code list', () => {
    for (const code of CALLING_CODES) {
      for (const other of CALLING_CODES) {
        if (code !== other) {
          expect(other.startsWith(code)).toBe(false)
        }
      }
    }
  })
})

describe('applyPhoneMask', () => {
  it('puts the caret after the last typed digit, including a separator inserted before it', () => {
    expect(applyPhoneMask('+7 9379', 7, '+7 937')).toEqual({ phone: '+7 937 9', caret: 8 })
  })

  it('deletes the digit before a separator when that separator is removed', () => {
    expect(applyPhoneMask('+7 9379', 6, '+7 937 9')).toEqual({ phone: '+7 939', caret: 5 })
  })

  it('keeps a caret inside an already masked number', () => {
    const phone = '+7 937 999 48 33'
    expect(applyPhoneMask(phone, 4, phone)).toEqual({ phone, caret: 4 })
  })
})
