import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api'

import {
  createNotificationPoller,
  type HandleResult,
  type NotificationPollerDeps,
  type ReceivedNotification,
} from '@/features/sync-chat/lib/create-notification-poller'

type Step = ReceivedNotification<string> | null | Error

/**
 * receive отдаёт шаги по очереди; когда шаги кончились — останавливает цикл через abort.
 */
function setup(steps: Step[], overrides: Partial<NotificationPollerDeps<string>> = {}) {
  const controller = new AbortController()
  const queue = [...steps]
  const receive = vi.fn(async () => {
    const step = queue.shift()

    if (step === undefined) {
      controller.abort()
      return null
    }

    if (step instanceof Error) {
      throw step
    }

    return step
  })
  const ack = vi.fn(async () => true)
  const handle = vi.fn((): HandleResult => ({ status: 'handled' }))
  const sleep = vi.fn(async (_ms: number, _signal: AbortSignal) => {})
  const onDropped = vi.fn()

  const deps: NotificationPollerDeps<string> = {
    receive,
    ack,
    handle,
    sleep,
    onDropped,
    random: () => 1,
    backoff_base_ms: 1000,
    backoff_max_ms: 30_000,
    max_handle_attempts: 3,
    ...overrides,
  }

  return { deps, controller, receive, ack, handle, sleep, onDropped, run: () => createNotificationPoller(deps).run(controller.signal) }
}

const notification = (receipt_id: number): ReceivedNotification<string> => ({ receipt_id, body: `body-${receipt_id}` })

describe('createNotificationPoller', () => {
  it('acks handled and skipped notifications and keeps polling on empty responses', async () => {
    const handle = vi.fn<() => HandleResult>().mockReturnValueOnce({ status: 'handled' }).mockReturnValueOnce({ status: 'skipped' })
    const { run, ack } = setup([notification(1), null, notification(2)], { handle })

    await run()

    expect(ack.mock.calls).toEqual([[1], [2]])
  })

  it('does not ack when handling throws, and retries the redelivered notification', async () => {
    const handle = vi
      .fn<() => HandleResult>()
      .mockImplementationOnce(() => {
        throw new Error('store failure')
      })
      .mockReturnValueOnce({ status: 'handled' })
    const { run, ack, sleep } = setup([notification(1), notification(1)], { handle })

    await run()

    expect(handle).toHaveBeenCalledTimes(2)
    expect(ack.mock.calls).toEqual([[1]])
    expect(sleep).toHaveBeenCalledOnce()
  })

  it('acks and drops a notification after max handling attempts', async () => {
    const handle = vi.fn<() => HandleResult>(() => {
      throw new Error('always fails')
    })
    const { run, ack, onDropped } = setup([notification(7), notification(7), notification(7)], { handle })

    await run()

    expect(handle).toHaveBeenCalledTimes(3)
    expect(onDropped).toHaveBeenCalledWith(7)
    expect(ack.mock.calls).toEqual([[7]])
  })

  it('runs after_ack only after a successful ack', async () => {
    const order: string[] = []
    const ack = vi.fn(async () => {
      order.push('ack')
      return true
    })
    const handle = vi.fn((): HandleResult => ({ status: 'handled', after_ack: () => order.push('after_ack') }))
    const { run } = setup([notification(1)], { ack, handle })

    await run()

    expect(order).toEqual(['ack', 'after_ack'])
  })

  it('backs off exponentially up to the maximum on network errors', async () => {
    const network_error = new TypeError('Failed to fetch')
    const { run, sleep } = setup(Array.from({ length: 7 }, () => network_error))

    await run()

    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([1000, 2000, 4000, 8000, 16_000, 30_000, 30_000])
  })

  it('resets the backoff after a successful cycle', async () => {
    const network_error = new TypeError('Failed to fetch')
    const { run, sleep } = setup([network_error, network_error, null, network_error])

    await run()

    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([1000, 2000, 1000])
  })

  it('stops on 401 without retrying', async () => {
    const { run, receive, sleep } = setup([new ApiError(401, 'Unauthorized'), null])

    await run()

    expect(receive).toHaveBeenCalledOnce()
    expect(sleep).not.toHaveBeenCalled()
  })

  it('does not handle a notification received after abort', async () => {
    const controller_holder: { abort?: () => void } = {}
    const receive = vi.fn(async () => {
      controller_holder.abort?.()
      return notification(1)
    })
    const { run, handle, ack, controller } = setup([], { receive })
    controller_holder.abort = () => controller.abort()

    await run()

    expect(handle).not.toHaveBeenCalled()
    expect(ack).not.toHaveBeenCalled()
  })
})
