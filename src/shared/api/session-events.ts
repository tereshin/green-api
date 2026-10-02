type SessionEvent = 'expired'
type Listener = () => void

/**
 * Минимальная шина событий сессии. `shared` не знает о роутере и сторах,
 * поэтому реакция на 'expired' (редирект, сброс кэша) подписывается в `app/`.
 */
function createSessionEvents() {
  const listeners_by_event = new Map<SessionEvent, Set<Listener>>()

  return {
    on(event: SessionEvent, listener: Listener): () => void {
      const listeners = listeners_by_event.get(event) ?? new Set<Listener>()
      listeners.add(listener)
      listeners_by_event.set(event, listeners)

      return () => listeners.delete(listener)
    },
    emit(event: SessionEvent): void {
      listeners_by_event.get(event)?.forEach((listener) => listener())
    },
  }
}

export const sessionEvents = createSessionEvents()
