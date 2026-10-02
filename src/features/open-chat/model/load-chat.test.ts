import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { instanceCredentials } from '@/shared/api'

import { useChatStore } from '@/entities/chat'
import { useMessageStore } from '@/entities/message'

import { loadChat } from '@/features/open-chat/model/load-chat'

const fetch_mock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

describe('loadChat', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetch_mock)
    instanceCredentials.set({ id_instance: '4100000000', api_token_instance: 'secret-token' })
    useChatStore.getState().reset()
    useMessageStore.getState().reset()
    useChatStore.getState().upsertChat({
      id: '100',
      phone: null,
      title: 'Анна',
      avatar_url: null,
      has_contact_info: true,
    })
  })

  afterEach(() => {
    fetch_mock.mockReset()
    vi.unstubAllGlobals()
    instanceCredentials.clear()
    useChatStore.getState().reset()
    useMessageStore.getState().reset()
  })

  it('requests history even when a notification message is already stored', async () => {
    useMessageStore.getState().upsertMessages([
      {
        id: 'live',
        chat_id: '100',
        text: 'привет',
        direction: 'incoming',
        timestamp: 2_000,
        is_deleted: false,
        is_edited: false,
      },
    ])
    fetch_mock.mockResolvedValue(
      jsonResponse([
        {
          type: 'incoming',
          idMessage: 'old',
          timestamp: 1,
          typeMessage: 'textMessage',
          chatId: '100',
          textMessage: 'раньше',
        },
      ]),
    )

    await expect(loadChat('100')).resolves.toBe('ready')

    expect(fetch_mock).toHaveBeenCalledTimes(1)
    expect(String(fetch_mock.mock.calls[0]?.[0])).toContain('/getChatHistory/')
    expect(useMessageStore.getState().history_loaded_chat_ids['100']).toBe(true)
    expect(useMessageStore.getState().message_ids_by_chat_id['100']).toEqual(['old', 'live'])
  })

  it('does not request history again after it was loaded', async () => {
    useMessageStore.getState().markHistoryLoaded('100')

    await expect(loadChat('100')).resolves.toBe('ready')

    expect(fetch_mock).not.toHaveBeenCalled()
  })
})
