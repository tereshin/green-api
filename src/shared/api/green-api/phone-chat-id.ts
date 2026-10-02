/** chatId GREEN-API для обращения к контакту по номеру телефона (только цифры). */
export function toPhoneChatId(phone_digits: string): string {
  return `${phone_digits}@c.us`
}
