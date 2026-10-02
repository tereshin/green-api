/** Резолвится по таймеру или сразу при abort — цикл поллера сам проверяет signal после ожидания. */
export function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve()
      return
    }

    const timer_id = setTimeout(() => {
      signal.removeEventListener('abort', handleAbort)
      resolve()
    }, ms)

    function handleAbort() {
      clearTimeout(timer_id)
      resolve()
    }

    signal.addEventListener('abort', handleAbort, { once: true })
  })
}
