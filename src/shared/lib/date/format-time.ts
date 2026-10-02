const LOCALE = 'ru-RU'
const DAY_MS = 24 * 60 * 60 * 1000

const time_format = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' })
const weekday_format = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' })
const date_format = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: '2-digit' })

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)

  return date.getTime()
}

/** Время сообщения: `14:05`. */
export function formatTime(timestamp: number): string {
  return time_format.format(timestamp)
}

/** Дата в списке чатов как в Telegram: сегодня — время, вчера, день недели в пределах недели, иначе дата. */
export function formatListDate(timestamp: number, now: number = Date.now()): string {
  const days_ago = Math.round((startOfDay(now) - startOfDay(timestamp)) / DAY_MS)

  if (days_ago <= 0) {
    return formatTime(timestamp)
  }

  if (days_ago === 1) {
    return 'Вчера'
  }

  if (days_ago < 7) {
    return weekday_format.format(timestamp)
  }

  return date_format.format(timestamp)
}
