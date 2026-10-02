import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { instanceCredentials } from '@/shared/api'

import { ensureChatHistory, loadOlderChatHistory } from '@/entities/message/model/ensure-chat-history'
import { useMessageStore } from '@/entities/message/model/useMessageStore'

const fetch_mock = vi.fn<typeof fetch>()
const store = () => useMessageStore.getState()
const response = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })
const page = (count: number, typeMessage = 'textMessage') => Array.from({ length: count }, (_, index) => ({
  type: 'incoming', idMessage: String(200 - index), timestamp: 200 - index,
  chatId: '100', typeMessage, textMessage: `Message ${200 - index}`,
}))
const requestedCounts = () => fetch_mock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)).count)

describe('chat history pagination', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetch_mock)
    instanceCredentials.set({ id_instance: '1', api_token_instance: 'token' })
    store().reset()
  })
  afterEach(() => {
    instanceCredentials.clear()
    store().reset()
    fetch_mock.mockReset()
    vi.unstubAllGlobals()
  })

  it('expands the count window and merges overlapping pages in chronological order', async () => {
    fetch_mock.mockResolvedValueOnce(response(page(50))).mockResolvedValueOnce(response(page(100)))
    await ensureChatHistory('100')
    await loadOlderChatHistory('100')
    expect(requestedCounts()).toEqual([50, 100])
    expect(store().message_ids_by_chat_id['100']).toEqual(Array.from({ length: 100 }, (_, i) => String(101 + i)))
    expect(store().history_by_chat_id['100']).toMatchObject({ has_more: true, requested_count: 100 })
    expect(JSON.parse(String(fetch_mock.mock.calls[1]?.[1]?.body))).toEqual({ chatId: '100', count: 100 })
  })

  it('uses raw message count including unsupported media and stops on a short page', async () => {
    fetch_mock.mockResolvedValueOnce(response(page(50, 'imageMessage'))).mockResolvedValueOnce(response(page(75)))
    await ensureChatHistory('100')
    expect(store().message_ids_by_chat_id['100']).toBeUndefined()
    expect(store().history_by_chat_id['100']?.has_more).toBe(true)
    await loadOlderChatHistory('100')
    expect(store().history_by_chat_id['100']).toMatchObject({ received_count: 75, has_more: false })
    await loadOlderChatHistory('100')
    expect(fetch_mock).toHaveBeenCalledTimes(2)
  })

  it('deduplicates concurrent loads, retaining the previous window after failure for retry', async () => {
    fetch_mock.mockResolvedValueOnce(response(page(50)))
    await ensureChatHistory('100')
    fetch_mock.mockRejectedValueOnce(new TypeError('offline'))
    const results = await Promise.allSettled([loadOlderChatHistory('100'), loadOlderChatHistory('100')])
    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected'])
    expect(store().history_by_chat_id['100']).toMatchObject({ requested_count: 50, has_more: true })
    fetch_mock.mockResolvedValueOnce(response(page(80)))
    await loadOlderChatHistory('100')
    expect(requestedCounts()).toEqual([50, 100, 100])
  })

  it('compensates for confirmed live messages without counting optimistic sends', async () => {
    fetch_mock.mockResolvedValueOnce(response(page(50))).mockResolvedValueOnce(response(page(80)))
    await ensureChatHistory('100')
    store().upsertMessages([
      { id: 'live', chat_id: '100', timestamp: 201_000, text: 'live', direction: 'incoming', is_deleted: false, is_edited: false },
      { id: 'temp-1', chat_id: '100', timestamp: 202_000, text: 'sending', direction: 'outgoing', status: 'pending', is_deleted: false, is_edited: false },
    ])
    await loadOlderChatHistory('100')
    expect(requestedCounts()).toEqual([50, 101])
    expect(store().message_ids_by_chat_id['100']?.slice(-2)).toEqual(['live', 'temp-1'])
  })

  it('marks empty history complete and does not reload it', async () => {
    fetch_mock.mockResolvedValueOnce(response([]))
    await ensureChatHistory('100')
    await ensureChatHistory('100')
    await loadOlderChatHistory('100')
    expect(fetch_mock).toHaveBeenCalledOnce()
    expect(store().history_by_chat_id['100']).toMatchObject({ received_count: 0, has_more: false })
  })

  it('does not apply a late page after the session changes', async () => {
    let resolve_old!: (value: Response) => void
    fetch_mock.mockImplementationOnce(() => new Promise<Response>((resolve) => { resolve_old = resolve }))
    const old = ensureChatHistory('100')
    const rejection = expect(old).rejects.toThrow()
    instanceCredentials.set({ id_instance: '2', api_token_instance: 'other' })
    store().reset()
    fetch_mock.mockResolvedValueOnce(response([]))
    await ensureChatHistory('100')
    resolve_old(response(page(50)))
    await rejection
    expect(store().message_by_id).toEqual({})
    expect(store().history_by_chat_id['100']?.has_more).toBe(false)
  })
})
