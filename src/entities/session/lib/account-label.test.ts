import { describe, expect, it } from 'vitest'

import { getAccountInitials, getAccountTitle } from '@/entities/session/lib/account-label'
import type { Account } from '@/entities/session/model/types'

const account: Account = {
  avatar_url: null,
  phone: '79876543210',
  chat_id: '10000000',
  username: '@username',
  history_sync_progress: 40,
}

describe('account labels', () => {
  it('prefers the username, then the phone', () => {
    expect(getAccountTitle(account)).toBe('@username')
    expect(getAccountTitle({ ...account, username: null })).toBe('+79876543210')
    expect(getAccountTitle({ ...account, username: null, phone: null })).toBeNull()
  })

  it('builds initials only from the username', () => {
    expect(getAccountInitials(account)).toBe('US')
    expect(getAccountInitials({ ...account, username: null })).toBeNull()
  })
})
