import { describe, expect, it } from 'vitest'

import { mapAccountSettings } from '@/entities/session/api/session-api'

describe('mapAccountSettings', () => {
  it('maps the GetAccountSettings payload', () => {
    expect(
      mapAccountSettings({
        avatar: 'https://4100.api.green-api.com/download/4100/avatar.jpg',
        phone: 79876543210,
        stateInstance: 'authorized',
        chatId: '10000000',
        username: '@username',
        historySyncProgress: 100,
      }),
    ).toEqual({
      state_instance: 'authorized',
      account: {
        avatar_url: 'https://4100.api.green-api.com/download/4100/avatar.jpg',
        phone: '79876543210',
        chat_id: '10000000',
        username: '@username',
        history_sync_progress: 100,
      },
    })
  })

  it('drops empty fields and non-http avatars', () => {
    expect(
      mapAccountSettings({
        avatar: 'javascript:alert(1)',
        phone: '',
        stateInstance: 'notAuthorized',
        chatId: '  ',
        username: '',
        historySyncProgress: null,
      }),
    ).toEqual({
      state_instance: 'notAuthorized',
      account: {
        avatar_url: null,
        phone: null,
        chat_id: null,
        username: null,
        history_sync_progress: 0,
      },
    })
  })

  it('clamps history progress into 0..100', () => {
    expect(mapAccountSettings({ stateInstance: 'authorized', historySyncProgress: 140 }).account.history_sync_progress).toBe(
      100,
    )
  })
})
