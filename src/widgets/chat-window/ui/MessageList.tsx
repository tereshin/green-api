import { EmptyState } from '@/shared/ui/empty-state'
import { ChatIcon } from '@/shared/ui/icons'

import { useMessageList } from '@/widgets/chat-window/model/useMessageList'
import { MessageListItem } from '@/widgets/chat-window/ui/MessageListItem'

type MessageListProps = {
  chat_id: string
}

export function MessageList({ chat_id }: MessageListProps) {
  const { container_ref, message_ids, virtualizer, pagination, handleScroll } = useMessageList(chat_id)
  const total_size = virtualizer.getTotalSize()
  const bottom_offset = Math.max(0, (virtualizer.scrollRect?.height ?? 0) - total_size)

  if (message_ids.length === 0 && !pagination.has_more) {
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-10 shrink-0 items-center justify-center px-3 text-sm empty:hidden">
        {pagination.has_more && (
          <button type="button" disabled={pagination.is_loading} onClick={pagination.loadMore} className="text-muted disabled:opacity-50">
            {pagination.is_loading ? 'Загрузка…' : pagination.is_error ? 'Не удалось загрузить историю. Повторить' : 'Загрузить более ранние сообщения'}
          </button>
        )}
      </div>
      <div ref={container_ref} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto [overflow-anchor:none] pt-3">
        <div className="relative mx-auto w-full max-w-3xl" style={{ height: total_size + bottom_offset }}>
          <ol aria-label="Сообщения" aria-live="polite">
            {virtualizer.getVirtualItems().map((item) => (
              <li key={item.key} data-index={item.index} data-message-id={message_ids[item.index]} ref={virtualizer.measureElement}
                className="absolute inset-x-0 top-0 px-3 sm:px-6" style={{ transform: `translateY(${item.start + bottom_offset}px)` }}>
                <MessageListItem message_id={message_ids[item.index]!} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
