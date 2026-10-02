import type { InstanceSettings, ReceivingIssue } from '@/entities/session/model/types'

export function checkReceivingSettings(settings: InstanceSettings): ReceivingIssue[] {
  const issues: ReceivingIssue[] = []

  if (settings.webhook_url.trim().length > 0) {
    issues.push('webhook_url_set')
  }

  if (!settings.is_incoming_webhook_enabled) {
    issues.push('incoming_webhook_disabled')
  }

  if (!settings.is_outgoing_api_webhook_enabled) {
    issues.push('outgoing_api_webhook_disabled')
  }

  return issues
}
