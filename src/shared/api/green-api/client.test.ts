import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ApiError } from '@/shared/api/api-error'
import { greenApiClient, MissingCredentialsError, ResponseValidationError } from '@/shared/api/green-api/client'
import { instanceCredentials } from '@/shared/api/green-api/credentials'
import { sessionEvents } from '@/shared/api/session-events'

const fetch_mock = vi.fn<typeof fetch>()

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('greenApiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetch_mock)
    instanceCredentials.set({ id_instance: '4100000000', api_token_instance: 'secret-token' })
  })

  afterEach(() => {
    fetch_mock.mockReset()
    vi.unstubAllGlobals()
    instanceCredentials.clear()
  })

  it('builds the GREEN-API path with query and suffix', async () => {
    fetch_mock.mockResolvedValueOnce(jsonResponse({ result: true })).mockResolvedValueOnce(jsonResponse(null))

    await greenApiClient.delete('deleteNotification', z.object({ result: z.boolean() }), { path_suffix: '42' })
    await greenApiClient.get('receiveNotification', z.null(), { query: { receiveTimeout: '20' } })

    expect(fetch_mock.mock.calls[0]?.[0]).toBe(
      'https://api.test.local/waInstance4100000000/deleteNotification/secret-token/42',
    )
    expect(fetch_mock.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE', credentials: 'omit' })
    expect(fetch_mock.mock.calls[1]?.[0]).toBe(
      'https://api.test.local/waInstance4100000000/receiveNotification/secret-token?receiveTimeout=20',
    )
  })

  it('sends JSON body for POST', async () => {
    fetch_mock.mockResolvedValue(jsonResponse({ idMessage: '1' }))

    await greenApiClient.post('sendMessage', { chatId: '1', message: 'hi' }, z.object({ idMessage: z.string() }))

    expect(fetch_mock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ chatId: '1', message: 'hi' }),
    })
  })

  it('throws MissingCredentialsError without credentials and does not call fetch', async () => {
    instanceCredentials.clear()

    await expect(greenApiClient.get('getStateInstance', z.unknown())).rejects.toBeInstanceOf(MissingCredentialsError)
    expect(fetch_mock).not.toHaveBeenCalled()
  })

  it('removes the token-bearing path from error payloads', async () => {
    fetch_mock.mockResolvedValue(
      jsonResponse({ statusCode: 400, message: 'Validation failed', path: '/waInstance1/sendMessage/secret-token' }, 400),
    )

    const error = await greenApiClient.post('sendMessage', {}, z.unknown()).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toBe('Validation failed')
    expect(JSON.stringify((error as ApiError).payload)).not.toContain('secret-token')
  })

  it('emits expired on 401', async () => {
    const listener = vi.fn()
    const unsubscribe = sessionEvents.on('expired', listener)
    fetch_mock.mockResolvedValue(new Response('', { status: 401 }))

    await expect(greenApiClient.get('getStateInstance', z.unknown())).rejects.toBeInstanceOf(ApiError)
    expect(listener).toHaveBeenCalledOnce()

    unsubscribe()
  })

  it('rejects responses that do not match the schema', async () => {
    fetch_mock.mockResolvedValue(jsonResponse({ stateInstance: 1 }))

    await expect(
      greenApiClient.get('getStateInstance', z.object({ stateInstance: z.string() })),
    ).rejects.toBeInstanceOf(ResponseValidationError)
  })

  it('treats an empty body as null', async () => {
    fetch_mock.mockResolvedValue(new Response('', { status: 200 }))

    await expect(greenApiClient.get('receiveNotification', z.null())).resolves.toBeNull()
  })
})

describe('instanceCredentials', () => {
  it('changes session id on every set and clear', () => {
    const initial = instanceCredentials.getSessionId()

    instanceCredentials.set({ id_instance: '1', api_token_instance: 't' })
    expect(instanceCredentials.isCurrentSession(initial)).toBe(false)

    const after_set = instanceCredentials.getSessionId()
    instanceCredentials.clear()
    expect(instanceCredentials.isCurrentSession(after_set)).toBe(false)
  })
})
