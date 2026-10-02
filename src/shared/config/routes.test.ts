import { describe, expect, it } from 'vitest'

import { chatPath, isChatsPath } from '@/shared/config/routes'

describe('chat routes', () => {
  it('encodes the chat id as a single path segment', () => {
    expect(chatPath('10000000')).toBe('/chats/10000000')
    expect(chatPath('79876543210@c.us')).toBe('/chats/79876543210%40c.us')
  })

  it('accepts only the chats section as a return path', () => {
    expect(isChatsPath('/chats')).toBe(true)
    expect(isChatsPath('/chats/100')).toBe(true)
    expect(isChatsPath('/chats-evil')).toBe(false)
    expect(isChatsPath('/login')).toBe(false)
  })
})
