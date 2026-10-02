/** receiveNotification принимает 5–60 с. */
export const RECEIVE_TIMEOUT_SECONDS = 5

export const BACKOFF_BASE_MS = 1000
export const BACKOFF_MAX_MS = 30_000

/** После стольких неудачных обработок одного receiptId уведомление подтверждается и отбрасывается. */
export const MAX_HANDLE_ATTEMPTS = 3
