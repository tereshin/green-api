import { describe, expect, it } from 'vitest'

import {
  filterPhoneInput,
  INITIAL_NEW_CHAT_FORM_STATE,
  isNewChatPhoneInvalid,
  newChatFormReducer,
  validatePhone,
} from '@/features/open-chat/lib/new-chat-form-reducer'
import { getOpenChatFailureMessage } from '@/features/open-chat/lib/open-chat-failure-message'

describe('filterPhoneInput', () => {
  it('converts pasted separators to spaces and removes unrelated characters', () => {
    expect(filterPhoneInput('abc+7 (900) 123-45-67xyz')).toBe('+7 900 123 45 67')
  })

  it.each(['+7 937 999 48 33', '+381 94 888 33 44'])('preserves international input %s', (value) => {
    expect(filterPhoneInput(value)).toBe(value)
    expect(validatePhone(filterPhoneInput(value))).toBeNull()
  })

  it('does not keep dashes or accept a number starting with zero', () => {
    const value = filterPhoneInput('--0349320948-4092840-')
    expect(value).not.toContain('-')
    expect(validatePhone(value)).not.toBeNull()
  })

  it('keeps a single plus only at the beginning and allows deleting the input', () => {
    expect(filterPhoneInput('++7 +937 999+ 48 33')).toBe('+7 937 999 48 33')
    expect(filterPhoneInput('7+9379994833')).toBe('79379994833')
    expect(filterPhoneInput('')).toBe('')
    expect(filterPhoneInput('+')).toBe('+')
  })
})

describe('validatePhone', () => {
  it('requires a value', () => {
    expect(validatePhone('  ')).toBe('Введите номер телефона')
  })

  it('rejects too short numbers', () => {
    expect(validatePhone('12345')).not.toBeNull()
  })

  it('accepts formatted international numbers', () => {
    expect(validatePhone('+7 (900) 123-45-67')).toBeNull()
  })
})

describe('newChatFormReducer', () => {
  it('field error is cleared by typing', () => {
    const invalid = newChatFormReducer(INITIAL_NEW_CHAT_FORM_STATE, { type: 'validation_failed', message: 'err' })

    expect(isNewChatPhoneInvalid(invalid)).toBe(true)

    const next = newChatFormReducer(invalid, { type: 'phone_changed', value: 'тел+7' })

    expect(next.phone).toBe('+7')
    expect(isNewChatPhoneInvalid(next)).toBe(false)
  })

  it('contact_not_found highlights the field until the phone is edited', () => {
    const failed = newChatFormReducer(
      { ...INITIAL_NEW_CHAT_FORM_STATE, phone: '79001234567' },
      { type: 'submit_failed', error: getOpenChatFailureMessage({ reason: 'contact_not_found' }) },
    )

    expect(failed.submit_error?.title).toBe('Контакт не найден')
    expect(isNewChatPhoneInvalid(failed)).toBe(true)

    const next = newChatFormReducer(failed, { type: 'phone_changed', value: '7900123456' })

    expect(next.submit_error).toBeNull()
    expect(isNewChatPhoneInvalid(next)).toBe(false)
  })

  it('network failure shows alert without highlighting the field', () => {
    const failed = newChatFormReducer(INITIAL_NEW_CHAT_FORM_STATE, {
      type: 'submit_failed',
      error: getOpenChatFailureMessage({ reason: 'network' }),
    })

    expect(failed.submit_error).not.toBeNull()
    expect(isNewChatPhoneInvalid(failed)).toBe(false)
  })

  it('reset returns the initial state', () => {
    const dirty = newChatFormReducer(INITIAL_NEW_CHAT_FORM_STATE, { type: 'phone_changed', value: '123' })
    const failed = newChatFormReducer(dirty, { type: 'validation_failed', message: 'err' })

    expect(newChatFormReducer(failed, { type: 'reset' })).toEqual(INITIAL_NEW_CHAT_FORM_STATE)
  })
})
