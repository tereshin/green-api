import { describe, expect, it, vi } from 'vitest'

import { parseNotificationBody } from '@/shared/api'

import { handleNotification, type NotificationTargets } from '@/features/sync-chat/model/handle-notification'

function createTargets() {
  return {
    upsertChat: vi.fn(),
    upsertMessages: vi.fn(),
    setStatus: vi.fn(),
    expireSession: vi.fn(),
  } satisfies NotificationTargets
}

const SENDER_DATA = {
  chatId: '10000000',
  sender: '10000000',
  chatName: 'Василиса',
  senderPhoneNumber: 79998887766,
}

describe('handleNotification', () => {
  it('stores the chat and message of an incoming text message', () => {
    const targets = createTargets()
    const body = parseNotificationBody({
      typeWebhook: 'incomingMessageReceived',
      timestamp: 1,
      idMessage: '100',
      senderData: SENDER_DATA,
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
    })

    expect(handleNotification(body, targets)).toEqual({ status: 'handled' })
    expect(targets.upsertChat).toHaveBeenCalledWith({
      id: '10000000',
      phone: '79998887766',
      title: 'Василиса',
      avatar_url: null,
      has_contact_info: false,
    })
    expect(targets.upsertMessages).toHaveBeenCalledWith([expect.objectContaining({ id: '100', direction: 'incoming' })])
  })

  it('does not take the phone from outgoing sender data', () => {
    const targets = createTargets()
    const body = parseNotificationBody({
      typeWebhook: 'outgoingAPIMessageReceived',
      timestamp: 1,
      idMessage: '101',
      senderData: SENDER_DATA,
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Ответ' } },
    })

    handleNotification(body, targets)

    expect(targets.upsertChat).toHaveBeenCalledWith(expect.objectContaining({ phone: null }))
  })

  it('skips non-text messages without touching stores', () => {
    const targets = createTargets()
    const body = parseNotificationBody({
      typeWebhook: 'incomingMessageReceived',
      timestamp: 1,
      idMessage: '102',
      senderData: SENDER_DATA,
      messageData: { typeMessage: 'imageMessage' },
    })

    expect(handleNotification(body, targets)).toEqual({ status: 'skipped' })
    expect(targets.upsertChat).not.toHaveBeenCalled()
    expect(targets.upsertMessages).not.toHaveBeenCalled()
  })

  it('applies delivery statuses', () => {
    const targets = createTargets()
    const body = parseNotificationBody({
      typeWebhook: 'outgoingMessageStatus',
      timestamp: 1,
      idMessage: '101',
      chatId: '10000000',
      status: 'read',
    })

    expect(handleNotification(body, targets)).toEqual({ status: 'handled' })
    expect(targets.setStatus).toHaveBeenCalledWith('101', 'read')
  })

  it('expires the session only after ack when the instance is logged out', () => {
    const targets = createTargets()
    const result = handleNotification(
      parseNotificationBody({ typeWebhook: 'stateInstanceChanged', timestamp: 1, stateInstance: 'notAuthorized' }),
      targets,
    )

    expect(targets.expireSession).not.toHaveBeenCalled()
    expect(result.status).toBe('handled')

    if (result.status === 'handled') {
      result.after_ack?.()
    }

    expect(targets.expireSession).toHaveBeenCalledOnce()
  })

  it('ignores transitional instance states and unsupported notifications', () => {
    const targets = createTargets()

    expect(
      handleNotification(
        parseNotificationBody({ typeWebhook: 'stateInstanceChanged', timestamp: 1, stateInstance: 'starting' }),
        targets,
      ),
    ).toEqual({ status: 'skipped' })
    expect(handleNotification(parseNotificationBody({ typeWebhook: 'incomingCall' }), targets)).toEqual({ status: 'skipped' })
    expect(targets.expireSession).not.toHaveBeenCalled()
  })
})
