import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { instanceCredentials } from '@/shared/api'

import { markChatRead } from '@/entities/chat/api/chat-api'

const fetch_mock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

function deferredResponse(): { promise: Promise<Response>; resolve: (response: Response) => void } {
  let resolve: (response: Response) => void = () => {}
  const promise = new Promise<Response>((settle) => {
    resolve = settle
  })

  return { promise, resolve }
}

describe('markChatRead', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetch_mock)
    instanceCredentials.set({ id_instance: '4100000000', api_token_instance: 'secret-token' })
  })

  afterEach(() => {
    fetch_mock.mockReset()
    vi.unstubAllGlobals()
    instanceCredentials.clear()
  })

  it('posts readChat for the opened chat', async () => {
    fetch_mock.mockResolvedValue(jsonResponse({ setRead: true }))

    await expect(markChatRead('10000000')).resolves.toBe(true)

    expect(fetch_mock).toHaveBeenCalledTimes(1)
    expect(String(fetch_mock.mock.calls[0]?.[0])).toContain('/readChat/')
    expect(fetch_mock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ chatId: '10000000' }),
    })
  })

  it('shares one request when the same chat is marked twice before the response', async () => {
    const pending = deferredResponse()
    fetch_mock.mockImplementation(() => pending.promise)

    const first = markChatRead('10000000')
    const second = markChatRead('10000000')

    expect(fetch_mock).toHaveBeenCalledTimes(1)

    pending.resolve(jsonResponse({ setRead: true }))

    await expect(Promise.all([first, second])).resolves.toEqual([true, true])
    expect(fetch_mock).toHaveBeenCalledTimes(1)
  })

  it('deduplicates the same chat even with another chat request in between', async () => {
    fetch_mock.mockImplementation(async () => jsonResponse({ setRead: true }))
    await expect(Promise.all([markChatRead('100'), markChatRead('200'), markChatRead('100')])).resolves.toEqual([true, true, true])
    expect(fetch_mock).toHaveBeenCalledTimes(2)
  })
})
