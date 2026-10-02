export type Chat = {
  /** Канонический chatId GREEN-API (числовой id Telegram), не номер телефона. */
  id: string
  phone: string | null
  title: string | null
  avatar_url: string | null
  /** true после GetContactInfo или если метод для этого чата неприменим (группа). */
  has_contact_info: boolean
}
