import { useCallback } from 'react'

import { sessionEvents } from '@/shared/api'

/**
 * Только локальное отключение: метод GREEN-API logout здесь не вызывается,
 * он отвязал бы Telegram-аккаунт от инстанса. Сброс данных выполняет `app`.
 */
export function useDisconnectInstance(): () => void {
  return useCallback(() => sessionEvents.emit('disconnect_requested'), [])
}
