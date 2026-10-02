import type { SendMessageFailure } from '@/features/send-message/model/send-message'

export function getSendFailureMessage(failure: SendMessageFailure): string {
  switch (failure.reason) {
    case 'empty_message':
      return 'Нельзя отправить пустое сообщение.'
    case 'message_too_long':
      return `Сообщение длиннее ${failure.max_length} символов.`
    case 'network':
      return 'Нет соединения с GREEN-API. Проверьте интернет и отправьте сообщение ещё раз.'
    case 'request_failed':
      return failure.status === 466
        ? 'Исчерпан лимит отправки сообщений для тарифа инстанса.'
        : failure.status >= 500 || failure.status === 0
          ? 'Сервис GREEN-API временно недоступен. Попробуйте позже.'
          : `Сервер вернул ошибку ${failure.status}.`
  }
}
