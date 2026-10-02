import { describe, expect, it } from 'vitest'

import type { Message } from '@/entities/message'

import { snapshotLastMessages } from '@/features/load-chats/model/snapshot-last-messages'

function incoming(id: string, timestamp: number, text = id): Message {
  return { id, chat_id: 'chat-1', text, direction: 'incoming', timestamp, is_deleted: false, is_edited: false }
}

describe('snapshotLastMessages', () => {
  it('keeps the newest confirmed message and skips pending drafts', () => {
    const messages = snapshotLastMessages({
      message_by_id: {
        old: incoming('old', 1_000, 'раньше'),
        live: incoming('live', 3_000, 'сейчас'),
        draft: {
          id: 'temp-1',
          chat_id: 'chat-1',
          text: 'черновик',
          direction: 'outgoing',
          timestamp: 4_000,
          status: 'pending',
          is_deleted: false,
          is_edited: false,
        },
      },
      message_ids_by_chat_id: { 'chat-1': ['old', 'live', 'temp-1'] },
    })

    expect(messages).toEqual([
      {
        chat_id: 'chat-1',
        id: 'live',
        text: 'сейчас',
        direction: 'incoming',
        timestamp: 3_000,
        is_deleted: false,
        is_edited: false,
      },
    ])
  })
})
