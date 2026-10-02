import { Button } from '@heroui/react'

import { EmptyState } from '@/shared/ui/empty-state'
import { AlertCircleIcon } from '@/shared/ui/icons'

import { useSessionStore, type RestoreFailureReason } from '@/entities/session'

import { restoreInstance } from '@/features/connect-instance'
import { useDisconnectInstance } from '@/features/disconnect-instance'

const RESTORE_COPY: Record<RestoreFailureReason, { title: string; description: string }> = {
  rate_limited: {
    title: 'Слишком много запросов',
    description: 'GREEN-API ограничил частоту запросов (429). Подождите немного и повторите.',
  },
  network: {
    title: 'Нет соединения',
    description: 'Не удалось связаться с GREEN-API. Проверьте интернет и повторите.',
  },
  unknown: {
    title: 'Не удалось восстановить сессию',
    description: 'Не удалось проверить аккаунт. Повторите попытку или войдите снова.',
  },
}

export function RestoreSessionPage() {
  const disconnect = useDisconnectInstance()
  const reason = useSessionStore((state) => (state.session.status === 'restore_failed' ? state.session.reason : 'unknown'))
  const copy = RESTORE_COPY[reason]

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <EmptyState>
        <EmptyState.Icon>
          <AlertCircleIcon className="size-6" />
        </EmptyState.Icon>
        <EmptyState.Title>{copy.title}</EmptyState.Title>
        <EmptyState.Description>{copy.description}</EmptyState.Description>
        <EmptyState.Actions>
          <Button variant="tertiary" onPress={disconnect}>
            Выйти
          </Button>
          <Button onPress={() => void restoreInstance()}>Повторить</Button>
        </EmptyState.Actions>
      </EmptyState>
    </div>
  )
}
