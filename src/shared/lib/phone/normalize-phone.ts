const PHONE_FORMATTING_CHARS = /[\s()+-]/g
const PHONE_DIGITS = /^[1-9]\d{9,14}$/
// Разделитель только между группами цифр; плюс только перед кодом страны.
const PHONE_FORMAT = /^\+?[1-9]\d*(?:(?:\s+|\s*-\s*|\s*\(\d+\)\s*)\d+)*$/

/**
 * Номер в международном формате → только цифры (10–15 для этой формы).
 * Национальные префиксы (например, ведущая 8) не переписываются: неверная догадка хуже явной ошибки.
 */
export function normalizePhone(input: string): string | null {
  const value = input.trim()
  if (!PHONE_FORMAT.test(value)) return null
  const digits = value.replace(PHONE_FORMATTING_CHARS, '')

  return PHONE_DIGITS.test(digits) ? digits : null
}
