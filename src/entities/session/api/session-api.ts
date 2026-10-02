import { greenApiClient } from '@/shared/api'

import { instanceSettingsSchema, instanceStateSchema, type InstanceSettingsDto } from '@/entities/session/api/schemas'
import type { InstanceSettings } from '@/entities/session/model/types'

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
