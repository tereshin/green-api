export type Account = {
  avatar_url: string | null
  phone: string | null
  chat_id: string | null
  username: string | null
  history_sync_progress: number
}

export type AccountSettings = {
  state_instance: string
  account: Account
}

export type InstanceSettings = {
  webhook_url: string
  is_incoming_webhook_enabled: boolean
  is_outgoing_api_webhook_enabled: boolean
}

/** Настройки инстанса, из-за которых получение уведомлений через HTTP API не работает или работает частично. */
export type ReceivingIssue = 'webhook_url_set' | 'incoming_webhook_disabled' | 'outgoing_api_webhook_disabled'

export type RestoreFailureReason = 'rate_limited' | 'network' | 'unknown'

export type SessionState =
  | { status: 'anonymous' }
  | { status: 'restoring' }
  | { status: 'restore_failed'; reason: RestoreFailureReason }
  | { status: 'authorized'; id_instance: string; receiving_issues: ReceivingIssue[]; account: Account }
