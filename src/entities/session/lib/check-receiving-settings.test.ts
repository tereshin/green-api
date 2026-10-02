import { describe, expect, it } from 'vitest'

import { mapInstanceSettings } from '@/entities/session/api/session-api'
import { checkReceivingSettings } from '@/entities/session/lib/check-receiving-settings'

describe('checkReceivingSettings', () => {
  it('returns no issues for an HTTP API ready instance', () => {
    const settings = mapInstanceSettings({ webhookUrl: '', incomingWebhook: 'yes', outgoingAPIMessageWebhook: 'yes' })

    expect(checkReceivingSettings(settings)).toEqual([])
  })

  it('reports every problem', () => {
    const settings = mapInstanceSettings({
      webhookUrl: 'https://example.com/hook',
      incomingWebhook: 'no',
      outgoingAPIMessageWebhook: 'no',
    })

    expect(checkReceivingSettings(settings)).toEqual([
      'webhook_url_set',
      'incoming_webhook_disabled',
      'outgoing_api_webhook_disabled',
    ])
  })

  it('treats missing fields as disabled and null webhook as empty', () => {
    expect(checkReceivingSettings(mapInstanceSettings({ webhookUrl: null }))).toEqual([
      'incoming_webhook_disabled',
      'outgoing_api_webhook_disabled',
    ])
  })
})
