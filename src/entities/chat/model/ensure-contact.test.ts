import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { instanceCredentials, SessionChangedError } from '@/shared/api'

import { deleteContactCache, flushCachedContacts, writeCachedContacts } from '@/entities/chat/api/contact-cache'
import { ensureContact, hydrateContactCache } from '@/entities/chat/model/ensure-contact'
import { useChatStore } from '@/entities/chat/model/useChatStore'

const fetch_mock = vi.fn<typeof fetch>()
const contact = { id: '100', phone: null, title: 'Cached', avatar_url: null, has_contact_info: true }
const response = (name: string) => new Response(JSON.stringify({ chatId: '100', name }), { status: 200 })

describe('ensureContact', () => {
  beforeEach(() => {
    vi.stubGlobal('indexedDB', new IDBFactory())
    vi.stubGlobal('fetch', fetch_mock)
    instanceCredentials.set({ id_instance: '1', api_token_instance: 'token-1' })
    useChatStore.getState().reset()
  })
  afterEach(async () => {
    instanceCredentials.clear()
    await Promise.all(['1', '2'].map(deleteContactCache))
    useChatStore.getState().reset()
    fetch_mock.mockReset()
    vi.unstubAllGlobals()
  })

  it('shares concurrent contact loads', async () => {
    fetch_mock.mockResolvedValue(response('Server'))
    const [first, second] = await Promise.all([ensureContact('100'), ensureContact('100')])
    expect(first).toEqual(second)
    expect(fetch_mock).toHaveBeenCalledOnce()
    expect(useChatStore.getState().chat_by_id['100']?.title).toBe('Server')
    expect(useChatStore.getState().chat_ids).toEqual([])
  })

  it('loads a cached contact without network and hydrates without overwriting known data', async () => {
    writeCachedContacts('1', [contact])
    await flushCachedContacts('1')
    await expect(ensureContact('100')).resolves.toEqual(contact)
    expect(useChatStore.getState().chat_ids).toEqual([])
    expect(fetch_mock).not.toHaveBeenCalled()
    useChatStore.getState().upsertChat({ ...contact, title: 'Live' })
    await hydrateContactCache()
    expect(useChatStore.getState().chat_by_id['100']?.title).toBe('Live')
  })

  it('does not reuse an old-account promise for the same chat id', async () => {
    let resolve_old!: (response: Response) => void
    fetch_mock.mockImplementationOnce(() => new Promise<Response>((resolve) => { resolve_old = resolve }))
    const old = ensureContact('100').catch((error: unknown) => error)
    await vi.waitFor(() => expect(fetch_mock).toHaveBeenCalledOnce())
    instanceCredentials.set({ id_instance: '2', api_token_instance: 'token-2' })
    useChatStore.getState().reset()
    fetch_mock.mockResolvedValueOnce(response('New account'))
    await expect(ensureContact('100')).resolves.toMatchObject({ title: 'New account' })
    resolve_old(response('Old account'))
    expect(await old).toBeInstanceOf(SessionChangedError)
    expect(fetch_mock).toHaveBeenCalledTimes(2)
    expect(useChatStore.getState().chat_by_id['100']?.title).toBe('New account')
  })

  it('resolves a cached phone to its canonical chat id when opening a chat', async () => {
    const stored = { ...contact, phone: '79000000000' }
    writeCachedContacts('1', [stored])
    await flushCachedContacts('1')
    await expect(ensureContact('79000000000@c.us', '79000000000')).resolves.toEqual(stored)
    expect(fetch_mock).not.toHaveBeenCalled()
    expect(useChatStore.getState().chat_by_id['100']).toEqual(stored)
  })
})
