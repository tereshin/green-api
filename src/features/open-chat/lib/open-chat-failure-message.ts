import type { NewChatSubmitError } from '@/features/open-chat/lib/new-chat-form-reducer'
import type { OpenChatFailure } from '@/features/open-chat/model/open-chat'

export function getOpenChatFailureMessage(failure: OpenChatFailure): NewChatSubmitError {
  switch (failure.reason) {
    case 'invalid_phone':
      return {
        title: 'Некорректный номер',
        description: 'Введите номер в международном формате: 10–15 цифр.',
        is_phone_invalid: true,
      }
    case 'contact_not_found':
      return {
        title: 'Контакт не найден',
        description: 'Номер не зарегистрирован в Telegram или скрыт настройками приватности.',
        is_phone_invalid: true,
      }
    case 'network':
      return {
        title: 'Нет соединения',
        description: 'Не удалось связаться с GREEN-API. Проверьте подключение и попробуйте ещё раз.',
        is_phone_invalid: false,
      }
    case 'session_changed':
      return {
        title: 'Сессия изменилась',
        description: 'Пока открывался чат, сессия была завершена. Войдите снова.',
        is_phone_invalid: false,
      }
    case 'request_failed':
      return {
        title: 'Не удалось открыть чат',
        description:
          failure.status >= 500 || failure.status === 0
            ? 'Сервис GREEN-API временно недоступен. Попробуйте позже.'
            : `Сервер вернул ошибку ${failure.status}.`,
        is_phone_invalid: false,
      }
  }
}
