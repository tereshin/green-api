import { beforeEach, describe, expect, it } from 'vitest'

import { mergeStatus } from '@/entities/message/model/message-status'
import type { OutgoingMessage } from '@/entities/message/model/types'
import { useMessageStore } from '@/entities/message/model/useMessageStore'

function outgoing(overrides: Partial<OutgoingMessage> = {}): OutgoingMessage {
  return {
    id: 'temp-1',
    chat_id: 'chat-1',
    text: 'hello',
    direction: 'outgoing',
    timestamp: 1000,
    status: 'pending',
    is_deleted: false,
    is_edited: false,
    ...overrides,
  }
}

const store = () => useMessageStore.getState()

describe('mergeStatus', () => {
  it('only moves forward', () => {
    expect(mergeStatus('delivered', 'sent')).toBe('delivered')
    expect(mergeStatus('sent', 'read')).toBe('read')
  })

  it('always applies failed and leaves failed only on server confirmation', () => {
    expect(mergeStatus('read', 'failed')).toBe('failed')
    expect(mergeStatus('failed', 'pending')).toBe('failed')
    expect(mergeStatus('failed', 'delivered')).toBe('delivered')
  })
})

describe('useMessageStore', () => {
  beforeEach(() => store().reset())

  it('keeps chat message ids sorted by timestamp without duplicates', () => {
    store().upsertMessages([
      { id: 'b', chat_id: 'chat-1', text: 'b', direction: 'incoming', timestamp: 2000, is_deleted: false, is_edited: false },
      { id: 'a', chat_id: 'chat-1', text: 'a', direction: 'incoming', timestamp: 1000, is_deleted: false, is_edited: false },
    ])
    store().upsertMessages([
      { id: 'a', chat_id: 'chat-1', text: 'a', direction: 'incoming', timestamp: 1000, is_deleted: false, is_edited: false },
    ])

    expect(store().message_ids_by_chat_id['chat-1']).toEqual(['a', 'b'])
  })

  it('renames the optimistic message on confirmation', () => {
    store().upsertMessages([outgoing()])
    store().confirmMessage('temp-1', outgoing({ id: 'server-1', status: 'sent' }))

    expect(store().message_by_id['temp-1']).toBeUndefined()
    expect(store().message_by_id['server-1']).toMatchObject({ status: 'sent' })
    expect(store().message_ids_by_chat_id['chat-1']).toEqual(['server-1'])
  })

  it('merges with a server message that arrived before the sendMessage response', () => {
    store().upsertMessages([outgoing()])
    store().upsertMessages([outgoing({ id: 'server-1', timestamp: 1500, status: 'sent' })])
    store().setStatus('server-1', 'delivered')

    store().confirmMessage('temp-1', outgoing({ id: 'server-1', status: 'sent' }))

    expect(store().message_ids_by_chat_id['chat-1']).toEqual(['server-1'])
    expect(store().message_by_id['server-1']).toMatchObject({ status: 'delivered', timestamp: 1500 })
  })

  it('applies a status that arrived before the message itself', () => {
    store().upsertMessages([outgoing()])
    store().setStatus('server-1', 'read')
    store().confirmMessage('temp-1', outgoing({ id: 'server-1', status: 'sent' }))

    expect(store().message_by_id['server-1']).toMatchObject({ status: 'read' })
    expect(store().early_status_by_id).toEqual({})
  })

  it('ignores confirmation after reset', () => {
    store().upsertMessages([outgoing()])
    store().reset()
    store().confirmMessage('temp-1', outgoing({ id: 'server-1', status: 'sent' }))

    expect(store().message_by_id).toEqual({})
  })

  it('marks a message as failed', () => {
    store().upsertMessages([outgoing()])
    store().markFailed('temp-1')

    expect(store().message_by_id['temp-1']).toMatchObject({ status: 'failed' })
  })

  it('keeps a live message from counting as loaded history', () => {
    store().upsertMessages([
      { id: 'live', chat_id: 'chat-1', text: 'привет', direction: 'incoming', timestamp: 2000, is_deleted: false, is_edited: false },
    ])

    expect(store().history_by_chat_id['chat-1']).toBeUndefined()

    store().setHistoryPage('chat-1', { requested_count: 50, received_count: 0, latest_timestamp: null, has_more: false })
    store().upsertMessages([
      { id: 'live-2', chat_id: 'chat-1', text: 'ещё', direction: 'incoming', timestamp: 3000, is_deleted: false, is_edited: false },
    ])

    expect(store().history_by_chat_id['chat-1']).toBeDefined()

    store().reset()

    expect(store().history_by_chat_id).toEqual({})
  })
})
