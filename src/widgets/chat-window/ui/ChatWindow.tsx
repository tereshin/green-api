import { Alert, Button, Skeleton } from '@heroui/react'

import { EmptyState } from '@/shared/ui/empty-state'
import { ChatIcon } from '@/shared/ui/icons'

import { useChatStore } from '@/entities/chat'
import { MessageListSkeleton, useMessageStore } from '@/entities/message'
import { ReceivingIssuesAlert, useSessionStore, type ReceivingIssue } from '@/entities/session'

import { SendMessageForm } from '@/features/send-message'

import { ChatHeader } from '@/widgets/chat-window/ui/ChatHeader'
import { MessageList } from '@/widgets/chat-window/ui/MessageList'

const NO_ISSUES: ReceivingIssue[] = []

type ChatWindowProps = {
  chat_id: string | null
  is_loading: boolean
  is_missing: boolean
  load_error: 'contact' | 'history' | null
  onRetry: () => void
  onBack: () => void
}

export function ChatWindow({ chat_id, is_loading, is_missing, load_error, onRetry, onBack }: ChatWindowProps) {
  const chat = useChatStore((state) => (chat_id ? state.chat_by_id[chat_id] : undefined))
  const is_known_chat = useChatStore((state) => chat_id !== null && state.chat_ids.includes(chat_id))
  const has_messages = useMessageStore((state) => (chat_id ? (state.message_ids_by_chat_id[chat_id]?.length ?? 0) > 0 : false))
  const receiving_issues = useSessionStore((state) =>
    state.session.status === 'authorized' ? state.session.receiving_issues : NO_ISSUES,
  )

  if (!chat_id) {
    return (
      <EmptyState className="flex-1">
        <EmptyState.Icon>
          <ChatIcon className="size-6" />
        </EmptyState.Icon>
        <EmptyState.Title>Выберите чат</EmptyState.Title>
        <EmptyState.Description>Откройте переписку из списка слева или начните новую.</EmptyState.Description>
      </EmptyState>
    )
  }

  if (!chat || !is_known_chat || is_missing) {
    if (load_error) {
      return (
        <EmptyState className="flex-1">
          <EmptyState.Title>Не удалось загрузить чат</EmptyState.Title>
          <EmptyState.Description>Проверьте соединение и повторите попытку.</EmptyState.Description>
          <EmptyState.Actions>
            <Button onPress={onRetry}>Повторить</Button>
            <Button variant="tertiary" onPress={onBack}>К чатам</Button>
          </EmptyState.Actions>
        </EmptyState>
      )
    }
    if (is_missing) {
      return (
        <EmptyState className="flex-1">
          <EmptyState.Icon>
            <ChatIcon className="size-6" />
          </EmptyState.Icon>
          <EmptyState.Title>Чат не найден</EmptyState.Title>
          <EmptyState.Description>Диалога с таким ID нет.</EmptyState.Description>
          <EmptyState.Actions>
            <Button onPress={onBack}>Закрыть</Button>
          </EmptyState.Actions>
        </EmptyState>
      )
    }

    return (
      <div className="flex min-h-0 flex-1 flex-col max-w-3xl mx-auto w-full" role="status" aria-label="Загружаем чат">
        <div className="flex items-center gap-3 border-b border-separator px-4 py-3">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </div>
        <MessageListSkeleton />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHeader chat={chat} onBack={onBack} />

      {load_error ? (
        <Alert status="danger" className="m-3 shadow-none">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{load_error === 'history' ? 'Не удалось загрузить историю' : 'Не удалось обновить контакт'}</Alert.Title>
            <Alert.Description>Проверьте соединение и повторите попытку.</Alert.Description>
          </Alert.Content>
          <Button size="sm" variant="tertiary" isDisabled={is_loading} onPress={onRetry}>Повторить</Button>
        </Alert>
      ) : null}

      {receiving_issues.length > 0 ? (
        <div className="shrink-0 px-3 pt-3 sm:px-6">
          <ReceivingIssuesAlert issues={receiving_issues} />
        </div>
      ) : null}

      {is_loading && !has_messages ? (
        <div role="status" aria-label="Загружаем историю" className="flex min-h-0 flex-1 flex-col justify-end  max-w-3xl mx-auto w-full">
          <MessageListSkeleton />
        </div>
      ) : !load_error || has_messages ? (
        <MessageList key={chat.id} chat_id={chat.id} />
      ) : <div className="min-h-0 flex-1" />}

      <div className="shrink-0 border-t border-separator pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-3xl   px-3 sm:px-6">
          <SendMessageForm key={chat.id} chat_id={chat.id} />
        </div>
      </div>
    </div>
  )
}
