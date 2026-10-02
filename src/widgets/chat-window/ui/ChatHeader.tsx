import { Button } from '@heroui/react'

import { formatPhone } from '@/shared/lib/phone'
import { ArrowLeftIcon } from '@/shared/ui/icons'

import { ChatAvatar, getChatDisplayName, type Chat } from '@/entities/chat'

type ChatHeaderProps = {
  chat: Chat
  onBack: () => void
}

export function ChatHeader({ chat, onBack }: ChatHeaderProps) {
  const subtitle = chat.title && chat.phone ? formatPhone(chat.phone) : 'Telegram'

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-separator px-2 py-2 md:px-4">
      <Button isIconOnly variant="ghost" aria-label="Назад к чатам" className="md:hidden" onPress={onBack}>
        <ArrowLeftIcon className="size-5" />
      </Button>
      <ChatAvatar chat={chat} />
      <div className="flex min-w-0 flex-col">
        <h2 className="truncate text-sm font-medium">{getChatDisplayName(chat)}</h2>
        <span className="truncate text-xs text-muted">{subtitle}</span>
      </div>
    </header>
  )
}
