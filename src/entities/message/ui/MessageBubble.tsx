import { cn } from '@heroui/react'

import { formatTime } from '@/shared/lib/date'

import type { Message } from '@/entities/message/model/types'
import { MessageStatusIcon } from '@/entities/message/ui/MessageStatusIcon'

type MessageBubbleProps = {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const is_outgoing = message.direction === 'outgoing'
  const is_deleted = message.is_deleted
  const is_edited = message.is_edited && !is_deleted
  const is_failed = is_outgoing && message.status === 'failed' && !is_deleted

  return (
    <div className={cn('flex w-full', is_outgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-1.5 text-sm sm:max-w-[70%]',
          is_outgoing ? 'rounded-br-md bg-accent text-accent-foreground' : 'rounded-bl-md bg-default text-foreground',
          is_failed && 'bg-danger-soft text-danger-soft-foreground',
        )}
      >
        <p className={cn('whitespace-pre-wrap break-words', is_deleted && 'italic opacity-80')}>
          {is_deleted ? 'Сообщение удалено' : message.text}
        </p>
        <div
          className={cn(
            'mt-0.5 flex items-center justify-end gap-1 text-[11px] leading-none',
            is_outgoing && !is_failed ? 'text-accent-foreground/75' : 'text-muted',
          )}
        >
          {is_edited ? <span>изменено</span> : null}
          {is_failed ? <span>Не отправлено</span> : null}
          <time dateTime={new Date(message.timestamp).toISOString()}>{formatTime(message.timestamp)}</time>
          {is_outgoing && !is_deleted ? <MessageStatusIcon status={message.status} /> : null}
        </div>
      </div>
    </div>
  )
}
