import { beforeEach, describe, expect, it } from 'vitest'

import type { Chat } from '@/entities/chat/model/types'
import { useChatStore } from '@/entities/chat/model/useChatStore'

function chat(overrides: Partial<Chat> & Pick<Chat, 'id'>): Chat {
  return {
    phone: null,
    title: null,
    avatar_url: null,
    has_contact_info: false,
    ...overrides,
  }
}

const store = () => useChatStore.getState()

describe('useChatStore', () => {
  beforeEach(() => store().reset())

  it('prepends a single new chat so an incoming conversation is first', () => {
    store().upsertChat(chat({ id: 'older', title: 'Older' }))
    store().upsertChat(chat({ id: 'newer', title: 'Newer' }))

    expect(store().chat_ids).toEqual(['newer', 'older'])
  })

  it('keeps contact metadata out of the sidebar until a conversation is explicitly registered', () => {
    const contact = chat({ id: '1', title: 'Cached', has_contact_info: true })
    store().upsertContacts([contact])
    expect(store().chat_ids).toEqual([])
    expect(store().chat_by_id['1']).toEqual(contact)
    store().upsertChat(contact)
    store().upsertChat(contact)
    expect(store().chat_ids).toEqual(['1'])
  })

  it('appends a batch in API order and does not reverse it', () => {
    store().upsertChats([
      chat({ id: 'first', title: 'First' }),
      chat({ id: 'second', title: 'Second' }),
      chat({ id: 'third', title: 'Third' }),
    ])

    expect(store().chat_ids).toEqual(['first', 'second', 'third'])
  })

  it('merges a later snapshot without wiping known fields or changing order', () => {
    store().upsertChat(chat({ id: '1', phone: '79876543210', title: 'Name', avatar_url: 'https://example.com/a.jpg' }))
    store().upsertChats([chat({ id: '1', title: 'Updated' }), chat({ id: '2', title: 'New' })])

    expect(store().chat_ids).toEqual(['1', '2'])
    expect(store().chat_by_id['1']).toEqual({
      id: '1',
      phone: '79876543210',
      title: 'Updated',
      avatar_url: 'https://example.com/a.jpg',
      has_contact_info: false,
    })
  })

  it('does not forget contact info when a poorer snapshot arrives later', () => {
    store().upsertChat(chat({ id: '1', title: 'Name', avatar_url: 'https://example.com/a.jpg', has_contact_info: true }))
    store().upsertChats([chat({ id: '1', title: 'Name' })])

    expect(store().chat_by_id['1']?.has_contact_info).toBe(true)
    expect(store().chat_by_id['1']?.avatar_url).toBe('https://example.com/a.jpg')
  })
})
