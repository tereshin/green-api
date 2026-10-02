import { Avatar } from '@heroui/react'

import { getChatDisplayName, getChatInitials } from '@/entities/chat/lib/get-chat-display-name'
import type { Chat } from '@/entities/chat/model/types'

const AVATAR_COLORS = ['accent', 'success', 'warning', 'danger', 'default'] as const

type ChatAvatarProps = {
  chat: Chat
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** Цвет стабилен для чата: выбирается по хэшу id. */
function pickColor(chat_id: string): (typeof AVATAR_COLORS)[number] {
  let hash = 0

  for (const char of chat_id) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }

  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? 'default'
}

export function ChatAvatar({ chat, size = 'md', className }: ChatAvatarProps) {
  return (
    <Avatar size={size} color={pickColor(chat.id)} variant="soft" className={className}>
      {chat.avatar_url ? <Avatar.Image alt={getChatDisplayName(chat)} src={chat.avatar_url} /> : null}
      <Avatar.Fallback>{getChatInitials(chat)}</Avatar.Fallback>
    </Avatar>
  )
}
