export type InstanceSettings = {
  webhook_url: string
  is_incoming_webhook_enabled: boolean
  is_outgoing_api_webhook_enabled: boolean
}

/** Настройки инстанса, из-за которых получение уведомлений через HTTP API не работает или работает частично. */
export type ReceivingIssue = 'webhook_url_set' | 'incoming_webhook_disabled' | 'outgoing_api_webhook_disabled'

export type SessionState =
  | { status: 'anonymous' }
  | { status: 'authorized'; id_instance: string; receiving_issues: ReceivingIssue[] }
