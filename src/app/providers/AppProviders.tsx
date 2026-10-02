import type { PropsWithChildren } from 'react'

import { ErrorBoundary } from '@/app/providers/ErrorBoundary'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AppRuntime } from '@/app/ui/AppRuntime'

/**
 * Единая точка композиции провайдеров приложения.
 * Порядок важен: внешние провайдеры не должны зависеть от внутренних.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AppRuntime>{children}</AppRuntime>
      </QueryProvider>
    </ErrorBoundary>
  )
}
