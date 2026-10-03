import { CALLING_CODES } from '@/features/open-chat/config/calling-codes'

/** E.164: не больше 15 цифр, без учёта «+» и пробелов. */
export const MAX_PHONE_DIGITS = 15

/** «+», 15 цифр и пробелы между группами. Дольше этой строки номер уже не растёт. */
export const MAX_PHONE_INPUT_LENGTH = 22

const CALLING_CODE_SET = new Set<string>(CALLING_CODES)
const CALLING_CODE_PREFIXES = new Set<string>()

for (const code of CALLING_CODES) {
  for (let length = 1; length < code.length; length += 1) {
    CALLING_CODE_PREFIXES.add(code.slice(0, length))
  }
}

// Код из 1–2 цифр: +7 937 999 48 33. Код из 3 цифр: +381 94 888 33 44.
const NATIONAL_GROUPS = {
  1: [3, 3, 2, 2, 2, 2],
  2: [3, 3, 2, 2, 2, 2],
  3: [2, 3, 2, 2, 2, 2],
} as const

const UNKNOWN_GROUPS = [3, 3, 3, 3, 3] as const

type CallingCodeMatch =
  | { kind: 'incomplete' }
  | { kind: 'matched'; code_length: 1 | 2 | 3 }
  | { kind: 'unknown' }

function isCodeLength(length: number): length is 1 | 2 | 3 {
  return length === 1 || length === 2 || length === 3
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function resolveCallingCode(digits: string): CallingCodeMatch {
  const max_length = Math.min(digits.length, 3)

  for (let length = max_length; length >= 1; length -= 1) {
    if (isCodeLength(length) && CALLING_CODE_SET.has(digits.slice(0, length))) {
      return { kind: 'matched', code_length: length }
    }
  }

  if (digits.length <= 3 && CALLING_CODE_PREFIXES.has(digits)) {
    return { kind: 'incomplete' }
  }

  return { kind: 'unknown' }
}

function formatGroups(digits: string, sizes: readonly number[]): string {
  const parts: string[] = []
  let offset = 0

  for (const size of sizes) {
    if (offset >= digits.length) break
    parts.push(digits.slice(offset, offset + size))
    offset += size
  }

  if (offset < digits.length) {
    parts.push(digits.slice(offset))
  }

  return parts.join(' ')
}

/** Цифры номера → «+» и группы через пробел. Пустая строка остаётся пустой, одинокий «+» сохраняется. */
export function maskPhoneInput(value: string): string {
  const digits = digitsOnly(value).slice(0, MAX_PHONE_DIGITS)

  if (digits.length === 0) {
    return value.includes('+') ? '+' : ''
  }

  const match = resolveCallingCode(digits)

  if (match.kind === 'incomplete') {
    return `+${digits}`
  }

  if (match.kind === 'matched') {
    const code = digits.slice(0, match.code_length)
    const national = digits.slice(match.code_length)

    if (national.length === 0) return `+${code}`

    return `+${code} ${formatGroups(national, NATIONAL_GROUPS[match.code_length])}`
  }

  return `+${formatGroups(digits, UNKNOWN_GROUPS)}`
}

function caretAfterDigits(formatted: string, digit_count: number): number {
  if (digit_count <= 0) {
    return formatted.startsWith('+') ? 1 : 0
  }

  let seen = 0

  for (let index = 0; index < formatted.length; index += 1) {
    const char = formatted[index] ?? ''

    if (char >= '0' && char <= '9') {
      seen += 1

      if (seen === digit_count) {
        const next = index + 1
        return formatted[next] === ' ' ? next + 1 : next
      }
    }
  }

  return formatted.length
}

/**
 * Маска с учётом каретки. Backspace по пробелу-разделителю удаляет цифру перед ним,
 * иначе курсор застревает на границе группы.
 */
export function applyPhoneMask(raw: string, selection: number, previous: string): { phone: string, caret: number } {
  const safe_selection = Math.max(0, Math.min(selection, raw.length))
  let digits = digitsOnly(raw)
  let digits_before = digitsOnly(raw.slice(0, safe_selection)).length
  const removed_count = previous.length - raw.length
  const removed = previous.slice(safe_selection, safe_selection + removed_count)

  if (removed_count > 0 && digits === digitsOnly(previous) && digits_before > 0 && removed.trim() === '') {
    digits = `${digits.slice(0, digits_before - 1)}${digits.slice(digits_before)}`
    digits_before -= 1
  }

  const kept = digits.slice(0, MAX_PHONE_DIGITS)
  const phone = maskPhoneInput(kept.length === 0 && raw.includes('+') ? '+' : kept)

  return { phone, caret: caretAfterDigits(phone, Math.min(digits_before, digitsOnly(phone).length)) }
}
