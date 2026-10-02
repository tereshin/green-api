import { greenApiClient } from '@/shared/api'

import {
  accountSettingsSchema,
  instanceSettingsSchema,
  instanceStateSchema,
  type AccountSettingsDto,
  type InstanceSettingsDto,
} from '@/entities/session/api/schemas'
import type { AccountSettings, InstanceSettings } from '@/entities/session/model/types'

function blankToNull(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const trimmed = String(value).trim()

  return trimmed.length > 0 ? trimmed : null
}

function digitsOrNull(value: string | number | null | undefined): string | null {
  const raw = blankToNull(value)

  if (!raw) {
    return null
  }

  const digits = raw.replace(/\D/g, '')

  return digits.length > 0 ? digits : null
}

/** Аватар с API — только http(s), иначе не подставляем его в src. */
function safeHttpUrl(value: string | null): string | null {
  if (!value) {
    return null
  }

  try {
    const url = new URL(value)

    return url.protocol === 'https:' || url.protocol === 'http:' ? value : null
  } catch {
    return null
  }
}

function clampProgress(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round(value)))
}

export function mapAccountSettings(dto: AccountSettingsDto): AccountSettings {
  return {
    state_instance: dto.stateInstance,
    account: {
      avatar_url: safeHttpUrl(blankToNull(dto.avatar)),
      phone: digitsOrNull(dto.phone),
      chat_id: blankToNull(dto.chatId),
      username: blankToNull(dto.username),
      history_sync_progress: clampProgress(dto.historySyncProgress),
    },
  }
}

export function mapInstanceSettings(dto: InstanceSettingsDto): InstanceSettings {
  return {
    webhook_url: dto.webhookUrl ?? '',
    is_incoming_webhook_enabled: dto.incomingWebhook === 'yes',
    is_outgoing_api_webhook_enabled: dto.outgoingAPIMessageWebhook === 'yes',
  }
}

export async function fetchInstanceState(signal?: AbortSignal): Promise<string> {
  const response = await greenApiClient.get('getStateInstance', instanceStateSchema, { signal })

  return response.stateInstance
}

export async function fetchInstanceSettings(signal?: AbortSignal): Promise<InstanceSettings> {
  const response = await greenApiClient.get('getSettings', instanceSettingsSchema, { signal })

  return mapInstanceSettings(response)
}

export async function fetchAccountSettings(signal?: AbortSignal): Promise<AccountSettings> {
  const response = await greenApiClient.get('getAccountSettings', accountSettingsSchema, { signal })

  return mapAccountSettings(response)
}
