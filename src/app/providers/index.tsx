import type { PropsWithChildren } from 'react'

import { ErrorBoundary } from '@/app/providers/ErrorBoundary'

/**
 * Единая точка композиции провайдеров приложения.
 * Порядок важен: внешние провайдеры не должны зависеть от внутренних.
 * Сюда добавляются Router, QueryClientProvider, ThemeProvider и т.д.
 */
export function AppProviders({ children }: PropsWithChildren) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
