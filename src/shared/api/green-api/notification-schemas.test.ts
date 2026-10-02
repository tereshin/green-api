import { describe, expect, it } from 'vitest'

import { parseNotificationBody } from '@/shared/api/green-api/notification-schemas'

const INCOMING_TEXT = {
  typeWebhook: 'incomingMessageReceived',
  instanceData: { idInstance: 4100000000, wid: '79876543210@c.us', typeInstance: 'telegram' },
  timestamp: 1763115112,
  idMessage: '1763115112345',
  senderData: {
    chatId: '10000000',
    chatType: 'user',
    sender: '10000000',
    chatName: 'Василиса Премудрая',
    senderName: 'Василиса Премудрая',
    senderPhoneNumber: 79998887766,
  },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'Привет', isForwarded: false },
  },
}

describe('parseNotificationBody', () => {
  it('parses a known notification and keeps extra fields', () => {
    const body = parseNotificationBody(INCOMING_TEXT)

    expect(body.typeWebhook).toBe('incomingMessageReceived')
    expect(body).toMatchObject({ senderData: { chatId: '10000000', chatType: 'user' } })
  })

  it('normalizes numeric ids to strings', () => {
    const body = parseNotificationBody({ ...INCOMING_TEXT, idMessage: 1763115112345 })

    expect(body).toMatchObject({ idMessage: '1763115112345' })
  })

  it('marks unknown types as unsupported', () => {
    expect(parseNotificationBody({ typeWebhook: 'incomingCall', timestamp: 1 })).toEqual({
      typeWebhook: 'unsupported',
      source_type: 'incomingCall',
    })
  })

  it('marks malformed known types as unsupported instead of throwing', () => {
    expect(parseNotificationBody({ typeWebhook: 'outgoingMessageStatus' })).toEqual({
      typeWebhook: 'unsupported',
      source_type: 'outgoingMessageStatus',
    })
    expect(parseNotificationBody(null)).toEqual({ typeWebhook: 'unsupported', source_type: 'unknown' })
  })
})
