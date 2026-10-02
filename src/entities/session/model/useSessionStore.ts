import { create } from 'zustand'

import type { ReceivingIssue, SessionState } from '@/entities/session/model/types'

type SessionStore = {
  session: SessionState
  authorize: (payload: { id_instance: string; receiving_issues: ReceivingIssue[] }) => void
  reset: () => void
}

/** Токена здесь нет: credentials живут только в `@/shared/api`. */
export const useSessionStore = create<SessionStore>()((set) => ({
  session: { status: 'anonymous' },
  authorize: ({ id_instance, receiving_issues }) =>
    set({ session: { status: 'authorized', id_instance, receiving_issues } }),
  reset: () => set({ session: { status: 'anonymous' } }),
}))
