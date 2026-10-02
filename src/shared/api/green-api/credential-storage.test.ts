import { afterEach, describe, expect, it, vi } from 'vitest'

import { instanceCredentials, hydrateInstanceCredentials } from '@/shared/api/green-api/credentials'
import { readStoredCredentials } from '@/shared/api/green-api/credential-storage'

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  }
}

describe('instance credential storage', () => {
  afterEach(() => {
    instanceCredentials.clear()
    vi.unstubAllGlobals()
  })

  it('keeps credentials in sessionStorage so a reload can restore them', () => {
    const storage = createMemoryStorage()
    vi.stubGlobal('sessionStorage', storage)

    instanceCredentials.set({ id_instance: '4100000000', api_token_instance: 'secret-token' })

    expect(readStoredCredentials(storage)).toEqual({
      id_instance: '4100000000',
      api_token_instance: 'secret-token',
    })
    expect(storage.getItem('green-api.instance-credentials')).not.toContain('4100000000secret')
  })

  it('restores a saved session into memory', () => {
    const storage = createMemoryStorage()
    vi.stubGlobal('sessionStorage', storage)
    storage.setItem(
      'green-api.instance-credentials',
      JSON.stringify({ id_instance: '42', api_token_instance: 'token' }),
    )

    hydrateInstanceCredentials()

    expect(instanceCredentials.hasCredentials()).toBe(true)
    expect(instanceCredentials.getIdInstance()).toBe('42')
  })

  it('drops a corrupted record and clears it', () => {
    const storage = createMemoryStorage()
    storage.setItem('green-api.instance-credentials', '{')

    expect(readStoredCredentials(storage)).toBeNull()
    expect(storage.getItem('green-api.instance-credentials')).toBeNull()
  })

  it('removes stored credentials on clear', () => {
    const storage = createMemoryStorage()
    vi.stubGlobal('sessionStorage', storage)
    instanceCredentials.set({ id_instance: '42', api_token_instance: 'token' })

    instanceCredentials.clear()

    expect(instanceCredentials.hasCredentials()).toBe(false)
    expect(readStoredCredentials(storage)).toBeNull()
  })
})
