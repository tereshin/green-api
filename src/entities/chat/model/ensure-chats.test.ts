import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { instanceCredentials } from '@/shared/api'

import { ensureChats, hasChat } from '@/entities/chat/model/ensure-chats'
import { useChatStore } from '@/entities/chat/model/useChatStore'

const fetch_mock = vi.fn<typeof fetch>()
const response = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

describe('ensureChats', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetch_mock)
    instanceCredentials.set({ id_instance: '1', api_token_instance: 'token' })
    useChatStore.getState().reset()
  })
  afterEach(() => {
    instanceCredentials.clear()
    useChatStore.getState().reset()
    fetch_mock.mockReset()
    vi.unstubAllGlobals()
  })

  it('shares the list request between sidebar and a direct route', async () => {
    fetch_mock.mockResolvedValue(response([{ chatId: '100', name: 'Анна' }]))
    const [, exists] = await Promise.all([ensureChats(), hasChat('100')])
    expect(exists).toBe(true)
    expect(fetch_mock).toHaveBeenCalledOnce()
    await expect(hasChat('missing')).resolves.toBe(false)
    expect(fetch_mock).toHaveBeenCalledOnce()
  })

  it('allows retry after a failed list request', async () => {
    fetch_mock.mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(response([]))
    await expect(hasChat('100')).rejects.toThrow('offline')
    await expect(hasChat('100')).resolves.toBe(false)
    expect(fetch_mock).toHaveBeenCalledTimes(2)
  })

  it('does not apply a late list from a previous account', async () => {
    let resolve_old!: (value: Response) => void
    fetch_mock.mockImplementationOnce(() => new Promise<Response>((resolve) => { resolve_old = resolve }))
    const old = ensureChats()
    const rejection = expect(old).rejects.toThrow()
    instanceCredentials.set({ id_instance: '2', api_token_instance: 'other' })
    useChatStore.getState().reset()
    fetch_mock.mockResolvedValueOnce(response([{ chatId: '200', name: 'New' }]))
    await ensureChats()
    resolve_old(response([{ chatId: '100', name: 'Old' }]))
    await rejection
    expect(useChatStore.getState().chat_ids).toEqual(['200'])
  })
})
