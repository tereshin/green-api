import { useRef } from 'react'

import { EmptyState } from '@/shared/ui/empty-state'
import { ChatIcon } from '@/shared/ui/icons'

import { MessageBubble, MessageListSkeleton, useMessageStore } from '@/entities/message'

import { useIsOpeningChat } from '@/features/open-chat'

import { useAutoScroll } from '@/widgets/chat-window/model/useAutoScroll'

const EMPTY_IDS: string[] = []

type MessageListProps = {
  chat_id: string
}

export function MessageList({ chat_id }: MessageListProps) {
  const container_ref = useRef<HTMLDivElement>(null)
  const message_ids = useMessageStore((state) => state.message_ids_by_chat_id[chat_id] ?? EMPTY_IDS)
  const message_by_id = useMessageStore((state) => state.message_by_id)
  const is_opening = useIsOpeningChat()

  const last_message = message_by_id[message_ids.at(-1) ?? '']
  const { handleScroll } = useAutoScroll(container_ref, last_message?.id ?? null, last_message?.direction === 'outgoing')

  if (message_ids.length === 0) {
    if (is_opening) {
      return (
        <div role="status" aria-label="Загружаем историю" className="flex min-h-0 flex-1 flex-col justify-end">
          <MessageListSkeleton />
        </div>
      )
    }

    return (
      <EmptyState className="flex-1">
        <EmptyState.Icon>
          <ChatIcon className="size-6" />
        </EmptyState.Icon>
        <EmptyState.Title>Сообщений пока нет</EmptyState.Title>
        <EmptyState.Description>Напишите первое сообщение — оно уйдёт получателю в Telegram.</EmptyState.Description>
      </EmptyState>
    )
  }

  return (
    <div ref={container_ref} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
      <ol aria-live="polite" className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-1.5 px-3 py-4 sm:px-6">
        {message_ids.map((message_id) => {
          const message = message_by_id[message_id]

          return message ? (
            <li key={message_id}>
              <MessageBubble message={message} />
            </li>
          ) : null
        })}
      </ol>
    </div>
  )
}
