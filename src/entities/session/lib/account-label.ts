import { formatPhone } from '@/shared/lib/phone'

import type { Account } from '@/entities/session/model/types'

export function getAccountTitle(account: Account): string | null {
  if (account.username) {
    return account.username
  }

  return account.phone ? formatPhone(account.phone) : null
}

export function getAccountInitials(account: Account): string | null {
  const username = account.username?.replace(/^@/, '')

  if (username && username.length > 0) {
    return username.slice(0, 2).toUpperCase()
  }

  return null
}
