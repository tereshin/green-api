import { Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'

import { CHATS_PATH, isChatsPath, LOGIN_PATH } from '@/shared/config/routes'

import { useSessionStore } from '@/entities/session'

import { AppShellSkeleton } from '@/widgets/app-shell'

import { ChatPage } from '@/pages/chat'
import { LoginPage, LoginPageSkeleton, RestoreSessionPage } from '@/pages/login'

function readReturnPath(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return null
  }

  const from = state.from

  return typeof from === 'string' && isChatsPath(from) ? from : null
}

function SessionGate({ children }: { children: ReactNode }) {
  const status = useSessionStore((state) => state.session.status)
  const location = useLocation()

  if (status === 'restoring') {
    return <AppShellSkeleton />
  }

  if (status === 'restore_failed') {
    return <RestoreSessionPage />
  }

  if (status !== 'authorized') {
    return <Navigate to={LOGIN_PATH} replace state={{ from: location.pathname }} />
  }

  return children
}

function LoginRoute() {
  const status = useSessionStore((state) => state.session.status)
  const location = useLocation()

  if (status === 'restoring') {
    return <LoginPageSkeleton />
  }

  if (status === 'restore_failed') {
    return <RestoreSessionPage />
  }

  if (status === 'authorized') {
    return <Navigate to={readReturnPath(location.state) ?? CHATS_PATH} replace />
  }

  return <LoginPage />
}

function ChatRoute() {
  return (
    <SessionGate>
      <Suspense fallback={<AppShellSkeleton />}>
        <ChatPage />
      </Suspense>
    </SessionGate>
  )
}

function EntryRedirect() {
  const status = useSessionStore((state) => state.session.status)

  if (status === 'restoring') {
    return <AppShellSkeleton />
  }

  if (status === 'restore_failed') {
    return <RestoreSessionPage />
  }

  return <Navigate to={status === 'authorized' ? CHATS_PATH : LOGIN_PATH} replace />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={LOGIN_PATH}
          element={
            <Suspense fallback={<LoginPageSkeleton />}>
              <LoginRoute />
            </Suspense>
          }
        />
        <Route path={CHATS_PATH} element={<ChatRoute />} />
        <Route path={`${CHATS_PATH}/:chat_id`} element={<ChatRoute />} />
        <Route path="*" element={<EntryRedirect />} />
      </Routes>
    </BrowserRouter>
  )
}
