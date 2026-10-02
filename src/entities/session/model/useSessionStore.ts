import { create } from 'zustand'

import { instanceCredentials } from '@/shared/api'

import type { Account, ReceivingIssue, RestoreFailureReason, SessionState } from '@/entities/session/model/types'

type AuthorizePayload = {
  id_instance: string
  receiving_issues: ReceivingIssue[]
  account: Account
}

type SessionStore = {
  session: SessionState
  beginRestore: () => void
  failRestore: (reason: RestoreFailureReason) => void
  authorize: (payload: AuthorizePayload) => void
  reset: () => void
}

function initialSession(): SessionState {
  return instanceCredentials.hasCredentials() ? { status: 'restoring' } : { status: 'anonymous' }
}

/** Токена здесь нет: credentials живут только в `@/shared/api`. */
export const useSessionStore = create<SessionStore>()((set) => ({
  session: initialSession(),
  beginRestore: () =>
    set((state) => (state.session.status === 'authorized' ? state : { session: { status: 'restoring' } })),
  failRestore: (reason) => set({ session: { status: 'restore_failed', reason } }),
  authorize: ({ id_instance, receiving_issues, account }) =>
    set({ session: { status: 'authorized', id_instance, receiving_issues, account } }),
  reset: () => set({ session: { status: 'anonymous' } }),
}))
