import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { instanceCredentials } from '@/shared/api'
import { useChatStore } from '@/entities/chat'
import { deleteContactCache, flushCachedContacts, writeCachedContacts } from '@/entities/chat/api/contact-cache'

import { chatsQueryOptions } from '@/features/load-chats/model/useLoadChats'

const fetch_mock = vi.fn<typeof fetch>()

vi.mock('@/features/load-chats/model/enrich-contacts', () => ({ enrichMissingContacts: vi.fn(async () => {}) }))

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function deferredResponse(): { promise: Promise<Response>; resolve: (response: Response) => void } {
  let resolve: (response: Response) => void = () => {}
  const promise = new Promise<Response>((settle) => {
    resolve = settle
  })

  return { promise, resolve }
}

describe('chatsQueryOptions', () => {
  afterEach(async () => {
    await deleteContactCache('4100000000')
    fetch_mock.mockReset()
    vi.unstubAllGlobals()
    instanceCredentials.clear()
    useChatStore.getState().reset()
  })

  it('keeps a single getChats when the observer remounts before the response', async () => {
    const pending = deferredResponse()
    fetch_mock.mockImplementation(() => pending.promise)
    vi.stubGlobal('fetch', fetch_mock)
    instanceCredentials.set({ id_instance: '4100000000', api_token_instance: 'secret-token' })

    const client = new QueryClient({
      defaultOptions: { queries: { retry: 2 } },
    })
    const options = chatsQueryOptions('4100000000')
    const first_observer = new QueryObserver(client, options)
    const unsubscribe = first_observer.subscribe(() => {})

    unsubscribe()

    const second_observer = new QueryObserver(client, options)
    second_observer.subscribe(() => {})

    expect(fetch_mock).toHaveBeenCalledTimes(1)

    pending.resolve(jsonResponse([{ chatId: '100', name: 'Анна', type: 'user', phoneNumber: 79000000000 }]))

    await vi.waitFor(() => {
      expect(second_observer.getCurrentResult().status).toBe('success')
    })

    expect(fetch_mock).toHaveBeenCalledTimes(1)
    expect(second_observer.getCurrentResult().data).toBe(true)
    expect(Object.values(useChatStore.getState().chat_by_id)).toEqual([
      {
        id: '100',
        phone: '79000000000',
        title: 'Анна',
        avatar_url: null,
        has_contact_info: false,
      },
    ])

    client.clear()
  })

  it('hydrates contacts even when the server request fails', async () => {
    vi.stubGlobal('indexedDB', new IDBFactory())
    vi.stubGlobal('fetch', fetch_mock)
    instanceCredentials.set({ id_instance: '4100000000', api_token_instance: 'secret-token' })
    const cached = { id: '100', phone: null, title: 'Cached', avatar_url: null, has_contact_info: true }
    writeCachedContacts('4100000000', [cached])
    await flushCachedContacts('4100000000')
    fetch_mock.mockRejectedValue(new TypeError('offline'))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await expect(client.fetchQuery(chatsQueryOptions('4100000000'))).rejects.toThrow('offline')
    await vi.waitFor(() => expect(useChatStore.getState().chat_by_id['100']).toEqual(cached))
    client.clear()
  })
})
