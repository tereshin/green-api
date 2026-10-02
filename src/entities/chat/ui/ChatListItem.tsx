import { cn } from '@heroui/react'
import type { ReactNode } from 'react'

import { getChatDisplayName } from '@/entities/chat/lib/get-chat-display-name'
import type { Chat } from '@/entities/chat/model/types'
import { ChatAvatar } from '@/entities/chat/ui/ChatAvatar'

type ChatListItemProps = {
  chat: Chat
  is_active: boolean
  /** Превью последнего сообщения; слот, потому что сообщения — другая сущность. */
  preview: ReactNode
  date_label: string | null
  onSelect: (chat_id: string) => void
}

export function ChatListItem({ chat, is_active, preview, date_label, onSelect }: ChatListItemProps) {
  return (
    <button
      type="button"
      aria-current={is_active ? 'true' : undefined}
      onClick={() => onSelect(chat.id)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left outline-none transition-colors cursor-pointer',
        'focus-visible:ring-2 focus-visible:ring-focus',
        is_active ? 'bg-accent text-accent-foreground' : 'hover:bg-default',
      )}
    >
      <ChatAvatar chat={chat} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{getChatDisplayName(chat)}</span>
          {date_label ? (
            <span className={cn('shrink-0 text-xs', is_active ? 'text-accent-foreground/80' : 'text-muted')}>
              {date_label}
            </span>
          ) : null}
        </span>
        <span className={cn('truncate text-sm', is_active ? 'text-accent-foreground/80' : 'text-muted')}>
          {preview}
        </span>
      </span>
    </button>
  )
}
