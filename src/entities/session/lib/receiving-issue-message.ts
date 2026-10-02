import type { ReceivingIssue } from '@/entities/session/model/types'

const ISSUE_MESSAGES: Record<ReceivingIssue, string> = {
  webhook_url_set: 'В настройках инстанса указан webhook URL — уведомления уходят туда, а не в этот интерфейс.',
  incoming_webhook_disabled: 'Отключены уведомления о входящих сообщениях — ответы не будут появляться.',
  outgoing_api_webhook_disabled: 'Отключены уведомления об отправленных через API сообщениях — статусы могут не обновляться.',
}

export function getReceivingIssueMessage(issue: ReceivingIssue): string {
  return ISSUE_MESSAGES[issue]
}
