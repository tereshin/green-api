import { describe, expect, it } from 'vitest'

import { mapChatListItem } from '@/entities/chat/api/chat-api'

describe('mapChatListItem', () => {
  it('maps a Telegram GetChats row', () => {
    expect(
      mapChatListItem({
        chatId: '10000000',
        name: 'Василиса Премудрая',
        type: 'user',
        phoneNumber: 79876543210,
      }),
    ).toEqual({
      id: '10000000',
      phone: '79876543210',
      title: 'Василиса Премудрая',
      avatar_url: null,
      has_contact_info: false,
    })
  })

  it('treats a hidden or group phone as missing', () => {
    expect(
      mapChatListItem({
        chatId: '-10000000000000',
        name: 'GREEN-API Super Group',
        type: 'supergroup',
        phoneNumber: 0,
      }),
    ).toEqual({
      id: '-10000000000000',
      phone: null,
      title: 'GREEN-API Super Group',
      avatar_url: null,
      has_contact_info: true,
    })
  })

  it('drops an empty name', () => {
    expect(mapChatListItem({ chatId: '10000002', name: '  ', phoneNumber: 0 })).toEqual({
      id: '10000002',
      phone: null,
      title: null,
      avatar_url: null,
      has_contact_info: false,
    })
  })
})
