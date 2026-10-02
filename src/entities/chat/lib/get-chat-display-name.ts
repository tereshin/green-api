import { formatPhone } from '@/shared/lib/phone'

import type { Chat } from '@/entities/chat/model/types'

export function getChatDisplayName(chat: Chat): string {
  if (chat.title) {
    return chat.title
  }

  return chat.phone ? formatPhone(chat.phone) : chat.id
}

/** Две буквы имени; без имени — две последние цифры номера/id. */
export function getChatInitials(chat: Chat): string {
  if (chat.title) {
    const letters = chat.title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0] ?? '')
      .join('')

    if (letters) {
      return letters.toUpperCase()
    }
  }

  return (chat.phone ?? chat.id).replace(/\D/g, '').slice(-2) || '?'
}
