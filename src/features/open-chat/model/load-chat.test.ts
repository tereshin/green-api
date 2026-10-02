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
    expect(useMessageStore.getState().history_by_chat_id['100']).toBeDefined()
    expect(useMessageStore.getState().message_ids_by_chat_id['100']).toEqual(['old', 'live'])
  })

  it('does not request history again after it was loaded', async () => {
    useMessageStore.getState().setHistoryPage('100', { requested_count: 50, received_count: 0, latest_timestamp: null, has_more: false })

    await expect(loadChat('100')).resolves.toBe('ready')

    expect(fetch_mock).not.toHaveBeenCalled()
  })

  it('exposes a history error and allows the next attempt to retry', async () => {
    fetch_mock.mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(jsonResponse([]))
    await expect(loadChat('100')).resolves.toBe('history_error')
    expect(useMessageStore.getState().history_by_chat_id['100']).toBeUndefined()
    await expect(loadChat('100')).resolves.toBe('ready')
    expect(fetch_mock).toHaveBeenCalledTimes(2)
  })

  it('deduplicates concurrent history requests', async () => {
    fetch_mock.mockResolvedValue(jsonResponse([]))
    await expect(Promise.all([loadChat('100'), loadChat('100')])).resolves.toEqual(['ready', 'ready'])
    expect(fetch_mock).toHaveBeenCalledOnce()
  })

  it('cancelling one consumer does not cancel another consumer of the same history', async () => {
    let resolve_response!: (response: Response) => void
    fetch_mock.mockImplementation(() => new Promise<Response>((resolve) => { resolve_response = resolve }))
    const controller = new AbortController()
    const first = loadChat('100', controller.signal)
    const second = loadChat('100')
    await vi.waitFor(() => expect(fetch_mock).toHaveBeenCalledOnce())
    controller.abort()
    resolve_response(jsonResponse([]))
    await expect(Promise.all([first, second])).resolves.toEqual(['aborted', 'ready'])
  })

  it('does not confuse a network error while loading a contact with a missing contact', async () => {
    useChatStore.getState().reset()
    fetch_mock.mockRejectedValueOnce(new TypeError('offline'))
    await expect(loadChat('100')).resolves.toBe('contact_error')
    fetch_mock.mockResolvedValueOnce(new Response('', { status: 404 }))
    await expect(loadChat('100')).resolves.toBe('missing')
  })

  it('rejects an unknown route without requesting contact info or adding a sidebar entry', async () => {
    fetch_mock.mockResolvedValueOnce(jsonResponse([{ chatId: '100', name: 'Анна' }]))
    await expect(loadChat('350780930')).resolves.toBe('missing')
    expect(fetch_mock).toHaveBeenCalledOnce()
    expect(String(fetch_mock.mock.calls[0]?.[0])).toContain('/getChats/')
    expect(useChatStore.getState().chat_ids).toEqual(['100'])
    expect(useChatStore.getState().chat_by_id['350780930']).toBeUndefined()
    expect(useMessageStore.getState().history_by_chat_id['350780930']).toBeUndefined()
  })

  it('does not treat cached contact metadata as an existing conversation', async () => {
    useChatStore.getState().upsertContacts([{ id: '350780930', title: 'Cached', phone: null, avatar_url: null, has_contact_info: true }])
    fetch_mock.mockResolvedValueOnce(jsonResponse([{ chatId: '100', name: 'Анна' }]))
    await expect(loadChat('350780930')).resolves.toBe('missing')
    expect(useChatStore.getState().chat_ids).toEqual(['100'])
    expect(fetch_mock).toHaveBeenCalledOnce()
  })

  it('does not share a history request across sessions or apply its late result', async () => {
    let resolve_old!: (response: Response) => void
    fetch_mock.mockImplementationOnce(() => new Promise<Response>((resolve) => { resolve_old = resolve }))
    const old = loadChat('100')
    await vi.waitFor(() => expect(fetch_mock).toHaveBeenCalledOnce())
    instanceCredentials.set({ id_instance: '2', api_token_instance: 'new-token' })
    useMessageStore.getState().reset()
    fetch_mock.mockResolvedValueOnce(jsonResponse([]))
    await expect(loadChat('100')).resolves.toBe('ready')
    resolve_old(jsonResponse([{ type: 'incoming', idMessage: 'old-session', timestamp: 1, typeMessage: 'textMessage', chatId: '100', textMessage: 'old' }]))
    await expect(old).resolves.toBe('aborted')
    expect(fetch_mock).toHaveBeenCalledTimes(2)
    expect(useMessageStore.getState().message_by_id).toEqual({})
  })
})
