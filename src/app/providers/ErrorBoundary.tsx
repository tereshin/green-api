import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react'

import { AppErrorFallback } from '@/app/ui/AppErrorFallback'

type ErrorBoundaryProps = PropsWithChildren<{
  fallback?: ReactNode
}>

type ErrorBoundaryState = {
  has_error: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { has_error: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { has_error: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Здесь подключается внешний мониторинг (Sentry и т.п.).
    // Никогда не логируем в отчёт токены, cookies и персональные данные.
    console.error('Unhandled render error', { error, component_stack: info.componentStack })
  }

  render() {
    if (this.state.has_error) {
      return this.props.fallback ?? <AppErrorFallback />
    }

    return this.props.children
  }
}
