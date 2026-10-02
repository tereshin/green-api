import { describe, expect, it } from 'vitest'

import { formatListDate, formatTime } from '@/shared/lib/date/format-time'

const NOW = new Date(2026, 9, 2, 13, 30).getTime()

describe('formatListDate', () => {
  it('shows time for today', () => {
    const timestamp = new Date(2026, 9, 2, 9, 5).getTime()

    expect(formatListDate(timestamp, NOW)).toBe(formatTime(timestamp))
  })

  it('shows "Вчера" for yesterday', () => {
    expect(formatListDate(new Date(2026, 9, 1, 23, 59).getTime(), NOW)).toBe('Вчера')
  })

  it('shows weekday within a week', () => {
    const result = formatListDate(new Date(2026, 8, 28, 10).getTime(), NOW)

    expect(result).not.toBe('Вчера')
    expect(result).not.toMatch(/\d/)
  })

  it('shows date for older messages', () => {
    expect(formatListDate(new Date(2026, 7, 15, 10).getTime(), NOW)).toBe('15.08.26')
  })
})
