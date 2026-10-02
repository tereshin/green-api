import type { z } from 'zod'

import { env } from '@/shared/config/env'

import { ApiError } from '@/shared/api/api-error'
import { readCredentials, type InstanceCredentials } from '@/shared/api/green-api/credentials'
import { captureSession } from '@/shared/api/green-api/session-context'
import { sessionEvents } from '@/shared/api/session-events'

type HttpMethod = 'GET' | 'POST' | 'DELETE'

type RequestOptions = {
  query?: Record<string, string>
  path_suffix?: string
  signal?: AbortSignal
}

export class MissingCredentialsError extends Error {
  constructor() {
    super('GREEN-API instance credentials are not set')
    this.name = 'MissingCredentialsError'
  }
}

export class ResponseValidationError extends Error {
  readonly issues: z.ZodError['issues']

  constructor(method: string, issues: z.ZodError['issues']) {
    super(`Unexpected response shape for ${method}`)
    this.name = 'ResponseValidationError'
    this.issues = issues
  }
}

/** URL содержит apiTokenInstance — его нельзя логировать и прокидывать в ошибки. */
function buildUrl(method: string, credentials: InstanceCredentials, options: RequestOptions): string {
  const id_instance = encodeURIComponent(credentials.id_instance)
  const api_token = encodeURIComponent(credentials.api_token_instance)
  const suffix = options.path_suffix ? `/${encodeURIComponent(options.path_suffix)}` : ''
  const query = options.query ? `?${new URLSearchParams(options.query).toString()}` : ''

  return `${env.api_base_url}/waInstance${id_instance}/${method}/${api_token}${suffix}${query}`
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()

  return text.length === 0 ? null : JSON.parse(text)
}

async function request<TSchema extends z.ZodType>(
  http_method: HttpMethod,
  method: string,
  schema: TSchema,
  options: RequestOptions & { body?: unknown } = {},
): Promise<z.infer<TSchema>> {
  const session = captureSession(options.signal)
  const credentials = readCredentials()

  if (!credentials) {
    throw new MissingCredentialsError()
  }

  session.assertCurrent()
  const { body } = options

  const response = await fetch(buildUrl(method, credentials, options), {
    method: http_method,
    signal: session.signal,
    // GREEN-API авторизует по токену в пути; cookies не нужны и ломают CORS с `*`.
    credentials: 'omit',
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // В том числе защищает от fetch-адаптеров, которые не соблюдают AbortSignal.
  session.assertCurrent()

  if (response.status === 401) {
    sessionEvents.emit('expired')
  }

  if (!response.ok) {
    throw await ApiError.fromResponse(response)
  }

  const parsed = schema.safeParse(await readJson(response))
  session.assertCurrent()

  if (!parsed.success) {
    throw new ResponseValidationError(method, parsed.error.issues)
  }

  return parsed.data
}

/** Ответ валидируется схемой на границе, тип выводится из неё. */
export const greenApiClient = {
  get: <TSchema extends z.ZodType>(method: string, schema: TSchema, options?: RequestOptions) =>
    request('GET', method, schema, options),
  post: <TSchema extends z.ZodType>(
    method: string,
    body: unknown,
    schema: TSchema,
    options?: Omit<RequestOptions, 'query' | 'path_suffix'>,
  ) => request('POST', method, schema, { ...options, body }),
  delete: <TSchema extends z.ZodType>(method: string, schema: TSchema, options?: Omit<RequestOptions, 'query'>) =>
    request('DELETE', method, schema, options),
}
