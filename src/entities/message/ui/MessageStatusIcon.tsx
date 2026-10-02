import { cn } from '@heroui/react'

import { AlertCircleIcon, CheckCheckIcon, CheckIcon, ClockIcon } from '@/shared/ui/icons'

import type { MessageStatus } from '@/entities/message/model/types'

const STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'Отправляется',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Не отправлено',
}

type MessageStatusIconProps = {
  status: MessageStatus
  className?: string
}

export function MessageStatusIcon({ status, className }: MessageStatusIconProps) {
  const icon_class = cn('size-3.5', className)

  return (
    <span role="img" aria-label={STATUS_LABELS[status]} className="inline-flex">
      {status === 'pending' ? <ClockIcon className={icon_class} /> : null}
      {status === 'sent' ? <CheckIcon className={icon_class} /> : null}
      {status === 'delivered' || status === 'read' ? <CheckCheckIcon className={icon_class} /> : null}
      {status === 'failed' ? <AlertCircleIcon className={cn(icon_class, 'text-danger')} /> : null}
    </span>
  )
}
