import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { instanceCredentials } from '@/shared/api'

import { useChatStore } from '@/entities/chat'
import { useMessageStore } from '@/entities/message'

import { routedChatQueryOptions } from '@/pages/chat/model/useRoutedChat'

const CHAT = { id: '100', phone: null, title: 'Анна', avatar_url: null, has_contact_info: true }
const fetch_mock = vi.fn<typeof fetch>()
let client: QueryClient

describe('routedChatQueryOptions', () => {
  beforeEach(() => {
    client = new QueryClient()
    vi.stubGlobal('fetch', fetch_mock)
    instanceCredentials.set({ id_instance: '1', api_token_instance: 'token' })
    useChatStore.getState().reset()
    useMessageStore.getState().reset()
    useChatStore.getState().upsertChat(CHAT)
  })
  afterEach(() => {
    client.clear()
    instanceCredentials.clear()
    fetch_mock.mockReset()
    vi.unstubAllGlobals()
    useChatStore.getState().reset()
    useMessageStore.getState().reset()
  })

  it('loads history even when a live message exists and keeps only load status in Query', async () => {
    useMessageStore.getState().upsertMessages([
      { id: 'live', chat_id: '100', text: 'привет', direction: 'incoming', timestamp: 2000, is_deleted: false, is_edited: false },
    ])
    fetch_mock.mockResolvedValue(new Response('[]', { status: 200 }))
    const options = routedChatQueryOptions('100', instanceCredentials.getSessionId())
    await expect(client.fetchQuery(options)).resolves.toBe('ready')
    expect(fetch_mock).toHaveBeenCalledOnce()
    expect(useMessageStore.getState().history_by_chat_id['100']).toBeDefined()
    expect(client.getQueryData(options.queryKey)).toBe('ready')
  })

  it('exposes the failed stage and retries history through refetch', async () => {
    fetch_mock.mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(new Response('[]'))
    const observer = new QueryObserver(client, routedChatQueryOptions('100', instanceCredentials.getSessionId()))
    observer.subscribe(() => {})
    await vi.waitFor(() => expect(observer.getCurrentResult().data).toBe('history_error'))
    await expect(observer.refetch()).resolves.toMatchObject({ data: 'ready' })
    expect(fetch_mock).toHaveBeenCalledTimes(2)
  })

  it('does not issue a request without a selected chat or after the session changes', async () => {
    const absent = new QueryObserver(client, routedChatQueryOptions(null, instanceCredentials.getSessionId()))
    absent.subscribe(() => {})
    const stale_options = routedChatQueryOptions('100', instanceCredentials.getSessionId())
    instanceCredentials.set({ id_instance: '2', api_token_instance: 'other' })
    await expect(client.fetchQuery(stale_options)).resolves.toBe('aborted')
    expect(fetch_mock).not.toHaveBeenCalled()
  })
})
