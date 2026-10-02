import { beforeEach, describe, expect, it } from 'vitest'

import { useChatStore } from '@/entities/chat'
import { useMessageStore } from '@/entities/message'

import { resolveChatLoadState } from '@/pages/chat/model/useRoutedChat'

const CHAT = {
  id: '100',
  phone: null,
  title: 'Анна',
  avatar_url: null,
  has_contact_info: true,
}

describe('resolveChatLoadState', () => {
  beforeEach(() => {
    useChatStore.getState().reset()
    useMessageStore.getState().reset()
  })

  it('still loads history when a notification already stored a message', () => {
    useChatStore.getState().upsertChat(CHAT)
    useMessageStore.getState().upsertMessages([
      {
        id: 'live',
        chat_id: '100',
        text: 'привет',
        direction: 'incoming',
        timestamp: 2000,
        is_deleted: false,
        is_edited: false,
      },
    ])

    expect(resolveChatLoadState('100')).toBe('loading')
  })

  it('skips loading after history was fetched', () => {
    useChatStore.getState().upsertChat(CHAT)
    useMessageStore.getState().markHistoryLoaded('100')

    expect(resolveChatLoadState('100')).toBe('ready')
  })
})
