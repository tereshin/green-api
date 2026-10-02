import { describe, expect, it } from 'vitest'

import { getChatDisplayName, getChatInitials } from '@/entities/chat/lib/get-chat-display-name'
import type { Chat } from '@/entities/chat/model/types'

const BASE_CHAT: Chat = { id: '123456789', phone: null, title: null, avatar_url: null, has_contact_info: false }

describe('getChatDisplayName', () => {
  it('prefers title', () => {
    expect(getChatDisplayName({ ...BASE_CHAT, title: 'Иван', phone: '79001234567' })).toBe('Иван')
  })

  it('falls back to formatted phone', () => {
    expect(getChatDisplayName({ ...BASE_CHAT, phone: '79001234567' })).toBe('+79001234567')
  })

  it('falls back to id', () => {
    expect(getChatDisplayName(BASE_CHAT)).toBe('123456789')
  })
})

describe('getChatInitials', () => {
  it('takes first letters of two words', () => {
    expect(getChatInitials({ ...BASE_CHAT, title: 'иван петров сидоров' })).toBe('ИП')
  })

  it('uses last phone digits without title', () => {
    expect(getChatInitials({ ...BASE_CHAT, phone: '79001234567' })).toBe('67')
  })

  it('uses id digits without phone', () => {
    expect(getChatInitials(BASE_CHAT)).toBe('89')
  })
})
