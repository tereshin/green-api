import { describe, expect, it } from 'vitest'

import { parseNotificationBody, type GreenApiMessageNotification } from '@/shared/api'

import {
  mapHistoryItemToMessage,
  mapNotificationToMessage,
  mapStatusWebhookToStatus,
} from '@/entities/message/api/mappers'

function messageNotification(type_webhook: string, message_data: Record<string, unknown>): GreenApiMessageNotification {
  const body = parseNotificationBody({
    typeWebhook: type_webhook,
    timestamp: 1763115112,
    idMessage: '100',
    senderData: { chatId: '10000000', sender: '10000000' },
    messageData: message_data,
  })

  if (body.typeWebhook === 'unsupported' || body.typeWebhook === 'outgoingMessageStatus' || body.typeWebhook === 'stateInstanceChanged') {
    throw new Error('expected a message notification')
  }

  return body
}

describe('mapNotificationToMessage', () => {
  it('maps an incoming text message', () => {
    const message = mapNotificationToMessage(
      messageNotification('incomingMessageReceived', { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } }),
    )

    expect(message).toEqual({
      id: '100',
      chat_id: '10000000',
      text: 'Привет',
      timestamp: 1763115112000,
      direction: 'incoming',
      is_deleted: false,
      is_edited: false,
    })
  })

  it('maps an outgoing API message as sent', () => {
    const message = mapNotificationToMessage(
      messageNotification('outgoingAPIMessageReceived', { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'Hi' } }),
    )

    expect(message).toMatchObject({ direction: 'outgoing', status: 'sent', text: 'Hi' })
  })

  it('ignores non-text messages', () => {
    expect(
      mapNotificationToMessage(messageNotification('incomingMessageReceived', { typeMessage: 'imageMessage' })),
    ).toBeNull()
  })
})

describe('mapHistoryItemToMessage', () => {
  it('maps outgoing history with its status', () => {
    expect(
      mapHistoryItemToMessage({
        type: 'outgoing',
        idMessage: '1',
        timestamp: 10,
        typeMessage: 'textMessage',
        chatId: '5',
        textMessage: 'text',
        statusMessage: 'read',
      }),
    ).toEqual({
      id: '1',
      chat_id: '5',
      text: 'text',
      timestamp: 10_000,
      direction: 'outgoing',
      status: 'read',
      is_deleted: false,
      is_edited: false,
    })
  })

  it('keeps a deleted message and marks an edited one', () => {
    expect(
      mapHistoryItemToMessage({
        type: 'incoming',
        idMessage: '2',
        timestamp: 11,
        typeMessage: 'textMessage',
        chatId: '5',
        textMessage: 'secret',
        isDeleted: true,
        isEdited: true,
      }),
    ).toMatchObject({ text: 'secret', is_deleted: true, is_edited: true })

    expect(
      mapHistoryItemToMessage({
        type: 'incoming',
        idMessage: '3',
        timestamp: 12,
        typeMessage: 'textMessage',
        chatId: '5',
        isDeleted: true,
      }),
    ).toMatchObject({ text: '', is_deleted: true, is_edited: false })
  })

  it('skips non-text history items', () => {
    expect(
      mapHistoryItemToMessage({ type: 'incoming', idMessage: '1', timestamp: 10, typeMessage: 'imageMessage', chatId: '5' }),
    ).toBeNull()
  })
})

describe('mapStatusWebhookToStatus', () => {
  it('maps delivery failures to failed and unknown values to null', () => {
    expect(mapStatusWebhookToStatus('delivered')).toBe('delivered')
    expect(mapStatusWebhookToStatus('noAccount')).toBe('failed')
    expect(mapStatusWebhookToStatus('somethingNew')).toBeNull()
    expect(mapStatusWebhookToStatus(undefined)).toBeNull()
  })
})
