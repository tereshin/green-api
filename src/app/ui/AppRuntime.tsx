import type { PropsWithChildren } from 'react'

import { useChatSync } from '@/features/sync-chat'

import { useSessionLifecycle } from '@/app/model/useSessionLifecycle'

/** Точка подключения жизненного цикла сессии и синхронизации чата; должен быть внутри QueryProvider. */
export function AppRuntime({ children }: PropsWithChildren) {
  useSessionLifecycle()
  useChatSync()

  return children
}
