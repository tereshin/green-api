import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  deleteContactCache, flushCachedContacts, readCachedContact, readCachedContacts, writeCachedContacts,
} from '@/entities/chat/api/contact-cache'
import { CONTACT_CACHE_TTL_MS, CONTACT_CACHE_VERSION, MAX_CACHED_CONTACTS } from '@/entities/chat/config/contact-cache'
import type { Chat } from '@/entities/chat/model/types'

const contact = (id: string): Chat => ({ id, phone: null, title: `Contact ${id}`, avatar_url: null, has_contact_info: true })
let factory: IDBFactory

async function openRaw(version = CONTACT_CACHE_VERSION): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open('chat-cache-1', version)
    request.onupgradeneeded = () => {
      request.result.createObjectStore('contacts', { keyPath: 'id' })
      if (version === 2) request.result.createObjectStore('last_messages', { keyPath: 'chat_id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function seed(rows: unknown[]): Promise<void> {
  const database = await openRaw()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('contacts', 'readwrite')
      for (const row of rows) transaction.objectStore('contacts').put(row)
      transaction.oncomplete = () => resolve()
      transaction.onabort = () => reject(transaction.error)
    })
  } finally {
    database.close()
  }
}

describe('contact-cache', () => {
  beforeEach(() => {
    factory = new IDBFactory()
    vi.stubGlobal('indexedDB', factory)
  })
  afterEach(async () => {
    await Promise.all(['1', '2'].map(deleteContactCache))
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('batches contacts and isolates accounts', async () => {
    const open = vi.spyOn(factory, 'open')
    writeCachedContacts('1', [contact('a')])
    writeCachedContacts('1', [contact('b')])
    expect(open).not.toHaveBeenCalled()
    await flushCachedContacts('1')
    expect(open).toHaveBeenCalledOnce()
    writeCachedContacts('2', [contact('other')])
    await flushCachedContacts('2')
    expect((await readCachedContacts('1')).map((chat) => chat.id).sort()).toEqual(['a', 'b'])
    expect(await readCachedContacts('2')).toEqual([contact('other')])
  })

  it('expires contacts and removes the expired rows from the database', async () => {
    const now = Date.now()
    await seed([{ ...contact('old'), cached_at: now - CONTACT_CACHE_TTL_MS }, { ...contact('fresh'), cached_at: now }])
    expect(await readCachedContacts('1')).toEqual([contact('fresh')])
    const database = await openRaw()
    const request = database.transaction('contacts').objectStore('contacts').count()
    const count = await new Promise<number>((resolve) => { request.onsuccess = () => resolve(request.result) })
    database.close()
    expect(count).toBe(1)
  })

  it('keeps only the most recently fetched contacts', async () => {
    const now = Date.now()
    await seed(Array.from({ length: MAX_CACHED_CONTACTS + 10 }, (_, index) => ({ ...contact(String(index)), cached_at: now - index })))
    const contacts = await readCachedContacts('1')
    expect(contacts).toHaveLength(MAX_CACHED_CONTACTS)
    expect(contacts[0]?.id).toBe('0')
    expect(await readCachedContact('1', String(MAX_CACHED_CONTACTS))).toBeNull()
  })

  it('validates every contact field and excludes unrelated fields when writing', async () => {
    await seed([{ id: 'broken', has_contact_info: true, cached_at: Date.now() }])
    expect(await readCachedContacts('1')).toEqual([])
    const extended = { ...contact('safe'), api_token_instance: 'must-not-persist', text: 'must-not-persist' }
    writeCachedContacts('1', [extended, { ...contact('incomplete'), has_contact_info: false }])
    await flushCachedContacts('1')
    expect(await readCachedContacts('1')).toEqual([contact('safe')])
    const database = await openRaw()
    const request = database.transaction('contacts').objectStore('contacts').get('safe')
    const stored = await new Promise<unknown>((resolve) => { request.onsuccess = () => resolve(request.result) })
    database.close()
    expect(JSON.stringify(stored)).not.toContain('must-not-persist')
  })

  it('resets a legacy database and retains only the contacts store', async () => {
    const legacy = await openRaw(2)
    legacy.close()
    expect(await readCachedContacts('1')).toEqual([])
    const database = await openRaw()
    expect([...database.objectStoreNames]).toEqual(['contacts'])
    database.close()
  })

  it('logout removes the database and cancels a queued write', async () => {
    writeCachedContacts('1', [contact('queued')])
    await deleteContactCache('1')
    await flushCachedContacts('1')
    expect(await factory.databases()).toEqual([])
  })

  it('does not recreate contact data if logout happens while a flush opens the database', async () => {
    writeCachedContacts('1', [contact('queued')])
    const flush = flushCachedContacts('1')
    const deletion = deleteContactCache('1')
    await Promise.all([flush, deletion])
    expect(await factory.databases()).toEqual([])
  })

  it('works without IndexedDB', async () => {
    vi.stubGlobal('indexedDB', undefined)
    writeCachedContacts('1', [contact('a')])
    await expect(readCachedContacts('1')).resolves.toEqual([])
    await expect(deleteContactCache('1')).resolves.toBeUndefined()
  })

  it('a blocked upgrade does not prevent falling back to the server', async () => {
    const legacy = await openRaw(2)
    try {
      await expect(readCachedContacts('1')).resolves.toEqual([])
    } finally {
      legacy.close()
    }
    await deleteContactCache('1')
    expect(await factory.databases()).toEqual([])
  })

  it('a blocked deletion remains queued without hanging the caller', async () => {
    const database = await openRaw()
    try {
      await expect(deleteContactCache('1')).resolves.toBeUndefined()
    } finally {
      database.close()
    }
    await deleteContactCache('1')
    expect(await factory.databases()).toEqual([])
  })

  it('storage permission failures are contained in the optional cache', async () => {
    vi.spyOn(factory, 'open').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
    vi.spyOn(factory, 'deleteDatabase').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError') })
    await expect(readCachedContacts('1')).resolves.toEqual([])
    await expect(deleteContactCache('1')).resolves.toBeUndefined()
  })

  it('serializes concurrent flushes so a newer contact cannot be overwritten by an older batch', async () => {
    writeCachedContacts('1', [contact('a')])
    const first = flushCachedContacts('1')
    writeCachedContacts('1', [{ ...contact('a'), title: 'Updated' }])
    const second = flushCachedContacts('1')
    await Promise.all([first, second])
    expect(await readCachedContact('1', 'a')).toMatchObject({ title: 'Updated' })
  })
})
