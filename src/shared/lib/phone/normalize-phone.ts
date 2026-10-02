const PHONE_FORMATTING_CHARS = /[\s()+-]/g
const PHONE_DIGITS = /^\d{10,15}$/

/**
 * Номер в международном формате → только цифры (10–15 по E.164).
 * Национальные префиксы (например, ведущая 8) не переписываются: неверная догадка хуже явной ошибки.
 */
export function normalizePhone(input: string): string | null {
  const digits = input.trim().replace(PHONE_FORMATTING_CHARS, '')

  return PHONE_DIGITS.test(digits) ? digits : null
}
