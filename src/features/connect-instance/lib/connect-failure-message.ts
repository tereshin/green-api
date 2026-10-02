import type { ConnectField, ConnectSubmitError } from '@/features/connect-instance/lib/connect-form-reducer'
import type { ConnectFailure } from '@/features/connect-instance/model/connect-instance'

function fieldError(fields: ConnectField[], field: ConnectField, message: string): ConnectSubmitError {
  return {
    messages: { [field]: message },
    invalid_fields: fields,
  }
}

export function getConnectFailureMessage(failure: ConnectFailure): ConnectSubmitError {
  switch (failure.reason) {
    case 'invalid_input':
    case 'invalid_credentials':
      return fieldError(
        ['id_instance', 'api_token_instance'],
        'api_token_instance',
        'Неверные учётные данные. Проверьте idInstance и apiTokenInstance в личном кабинете GREEN-API.',
      )
    case 'instance_not_authorized':
      return fieldError(
        ['id_instance'],
        'id_instance',
        `Инстанс не авторизован. Состояние инстанса: ${failure.state_instance}. Авторизуйте Telegram-аккаунт в личном кабинете и повторите вход.`,
      )
    case 'network':
      return fieldError(
        ['api_token_instance'],
        'api_token_instance',
        'Нет соединения. Не удалось связаться с GREEN-API. Проверьте подключение к интернету.',
      )
    case 'rate_limited':
      return fieldError(
        ['api_token_instance'],
        'api_token_instance',
        'Слишком много запросов к GREEN-API. Подождите немного и повторите вход.',
      )
    case 'session_changed':
      return fieldError(
        ['api_token_instance'],
        'api_token_instance',
        'Вход прерван. Сессия изменилась во время входа. Попробуйте ещё раз.',
      )
    case 'request_failed':
      return fieldError(
        ['api_token_instance'],
        'api_token_instance',
        failure.status >= 500 || failure.status === 0
          ? 'Не удалось войти. Сервис GREEN-API временно недоступен. Попробуйте позже.'
          : `Не удалось войти. Сервер вернул ошибку ${failure.status}.`,
      )
  }
}
