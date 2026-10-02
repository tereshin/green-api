import { Alert, Button, ScrollShadow, Tooltip } from '@heroui/react'
import { useState } from 'react'

import { formatListDate } from '@/shared/lib/date'
import { formatPhone } from '@/shared/lib/phone'
import { EmptyState } from '@/shared/ui/empty-state'
import { ChatIcon, ComposeIcon } from '@/shared/ui/icons'

import { ChatListItem, ChatListItemSkeleton } from '@/entities/chat'

import { useLoadChats } from '@/features/load-chats'
import { NewChatModal, useIsOpeningChat } from '@/features/open-chat'

import { useChatListItems, type ChatListEntry } from '@/widgets/chat-sidebar/model/useChatListItems'

const SIDEBAR_SKELETON_ROWS = 6

function getPreview(entry: ChatListEntry): string {
  if (entry.last_message) {
    return entry.last_message.direction === 'outgoing' ? `Вы: ${entry.last_message.text}` : entry.last_message.text
  }

  return entry.chat.phone ? formatPhone(entry.chat.phone) : ''
}

type ChatSidebarProps = {
  active_chat_id: string | null
  onSelectChat: (chat_id: string) => void
}

export function ChatSidebar({ active_chat_id, onSelectChat }: ChatSidebarProps) {
  const [is_new_chat_open, setIsNewChatOpen] = useState(false)
  const entries = useChatListItems()
  const is_opening = useIsOpeningChat()
  const { isPending: is_pending, isError: is_error, refetch } = useLoadChats()
  // Пока создаётся чат, список уже есть или пуст. Скелетон первой загрузки здесь лишний:
  // кнопка модалки сама показывает «Открываем…».
  const is_first_load = is_pending && entries.length === 0 && !is_opening

  const openNewChat = () => setIsNewChatOpen(true)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <h1 className="text-lg font-semibold">Чаты</h1>
        <Tooltip delay={300}>
          <Button isIconOnly variant="ghost" aria-label="Новое сообщение" onPress={openNewChat}>
            <ComposeIcon className="size-5" />
          </Button>
          <Tooltip.Content>Новое сообщение</Tooltip.Content>
        </Tooltip>
      </header>

      {is_error ? (
        <div className="px-3 pb-2">
          <Alert status="danger" className="shadow-none">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Не удалось загрузить чаты</Alert.Title>
              <Alert.Description>Проверьте соединение и повторите попытку.</Alert.Description>
            </Alert.Content>
            <Button size="sm" variant="tertiary" onPress={() => void refetch()}>
              Повторить
            </Button>
          </Alert>
        </div>
      ) : null}

      {is_first_load ? (
        <ul aria-label="Загружаем чаты" className="flex flex-col gap-0.5 px-2 pb-2">
          {Array.from({ length: SIDEBAR_SKELETON_ROWS }, (_, index) => (
            <li key={index}>
              <ChatListItemSkeleton />
            </li>
          ))}
        </ul>
      ) : entries.length === 0 ? (
        <EmptyState className="flex-1">
          <EmptyState.Icon>
            <ChatIcon className="size-6" />
          </EmptyState.Icon>
          <EmptyState.Title>Чатов пока нет</EmptyState.Title>
          <EmptyState.Description>Отправьте сообщение по номеру телефона, чтобы начать переписку.</EmptyState.Description>
          <EmptyState.Actions>
            <Button onPress={openNewChat}>
              <ComposeIcon className="size-4" />
              Отправить сообщение
            </Button>
          </EmptyState.Actions>
        </EmptyState>
      ) : (
        <ScrollShadow hideScrollBar className="min-h-0 flex-1">
          <ul className="flex flex-col gap-0.5 px-2 pb-2">
            {entries.map((entry) => (
              <li key={entry.chat.id}>
                <ChatListItem
                  chat={entry.chat}
                  is_active={entry.chat.id === active_chat_id}
                  preview={getPreview(entry)}
                  date_label={entry.last_message ? formatListDate(entry.last_message.timestamp) : null}
                  onSelect={onSelectChat}
                />
              </li>
            ))}
          </ul>
        </ScrollShadow>
      )}

      <NewChatModal is_open={is_new_chat_open} onOpenChange={setIsNewChatOpen} onChatOpened={onSelectChat} />
    </div>
  )
}
