import { ApiError, MissingCredentialsError } from '@/shared/api'

/**
 * handled/skipped подтверждаются (ack). after_ack — эффект, который нельзя выполнять до
 * подтверждения: например, завершение сессии, иначе уведомление вернётся при следующем входе.
 */
export type HandleResult = { status: 'handled'; after_ack?: () => void } | { status: 'skipped' }

export type ReceivedNotification<TBody> = {
  receipt_id: number
  body: TBody
}

export type NotificationPollerDeps<TBody> = {
  receive: (signal: AbortSignal) => Promise<ReceivedNotification<TBody> | null>
  ack: (receipt_id: number) => Promise<unknown>
  handle: (body: TBody) => HandleResult | Promise<HandleResult>
  sleep: (ms: number, signal: AbortSignal) => Promise<void>
  random?: () => number
  onDropped?: (receipt_id: number) => void
  backoff_base_ms: number
  backoff_max_ms: number
  max_handle_attempts: number
}

/** Ошибки, после которых повторять бессмысленно: сессия недействительна, её сбросит sessionEvents. */
function isFatalError(error: unknown): boolean {
  return error instanceof MissingCredentialsError || (error instanceof ApiError && error.status === 401)
}

/**
 * Независимый от React long-polling цикл receiveNotification → handle → deleteNotification
 * с внедряемыми зависимостями. Политика подтверждения:
 * - handled/skipped — ack;
 * - исключение в handle — без ack, backoff, сервер вернёт уведомление повторно
 *   (handle обязан быть идемпотентным);
 * - max_handle_attempts неудач по одному receiptId — ack и сознательный отброс через onDropped.
 */
export function createNotificationPoller<TBody>(deps: NotificationPollerDeps<TBody>) {
  const random = deps.random ?? Math.random
  const attempts_by_receipt_id = new Map<number, number>()

  function backoffDelay(consecutive_failures: number): number {
    const exponential = Math.min(deps.backoff_max_ms, deps.backoff_base_ms * 2 ** (consecutive_failures - 1))

    return Math.round(exponential * (0.5 + random() * 0.5))
  }

  async function processNotification({ receipt_id, body }: ReceivedNotification<TBody>): Promise<void> {
    let result: HandleResult | null = null

    try {
      result = await deps.handle(body)
    } catch (error) {
      const attempts = (attempts_by_receipt_id.get(receipt_id) ?? 0) + 1

      if (attempts < deps.max_handle_attempts) {
        attempts_by_receipt_id.set(receipt_id, attempts)
        throw error
      }

      deps.onDropped?.(receipt_id)
    }

    await deps.ack(receipt_id)
    attempts_by_receipt_id.delete(receipt_id)

    if (result?.status === 'handled') {
      result.after_ack?.()
    }
  }

  return {
    async run(signal: AbortSignal): Promise<void> {
      let consecutive_failures = 0

      while (!signal.aborted) {
        try {
          const notification = await deps.receive(signal)

          // Полученное после отмены уведомление не обрабатывается: без ack сервер отдаст его снова.
          if (signal.aborted) {
            return
          }

          if (notification) {
            await processNotification(notification)
          }

          consecutive_failures = 0
        } catch (error) {
          if (signal.aborted || isFatalError(error)) {
            return
          }

          consecutive_failures += 1
          await deps.sleep(backoffDelay(consecutive_failures), signal)
        }
      }
    },
  }
}
