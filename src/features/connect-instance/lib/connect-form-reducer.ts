export type ConnectField = 'id_instance' | 'api_token_instance'

export type ConnectFormValues = Record<ConnectField, string>

export type ConnectFieldErrors = Partial<Record<ConnectField, string>>

export type ConnectSubmitError = {
  /** Текст под полем. Поле может подсвечиваться и без текста. */
  messages: ConnectFieldErrors
  invalid_fields: ConnectField[]
}

export type ConnectFormState = {
  values: ConnectFormValues
  field_errors: ConnectFieldErrors
  submit_error: ConnectSubmitError | null
}

export type ConnectFormAction =
  | { type: 'field_changed'; field: ConnectField; value: string }
  | { type: 'validation_failed'; field_errors: ConnectFieldErrors }
  | { type: 'submit_started' }
  | { type: 'submit_failed'; error: ConnectSubmitError }

export const INITIAL_CONNECT_FORM_STATE: ConnectFormState = {
  values: { id_instance: '', api_token_instance: '' },
  field_errors: {},
  submit_error: null,
}

const ID_INSTANCE_PATTERN = /^\d+$/

export function validateConnectForm(values: ConnectFormValues): ConnectFieldErrors {
  const field_errors: ConnectFieldErrors = {}
  const id_instance = values.id_instance.trim()

  if (id_instance.length === 0) {
    field_errors.id_instance = 'Введите idInstance'
  } else if (!ID_INSTANCE_PATTERN.test(id_instance)) {
    field_errors.id_instance = 'idInstance состоит только из цифр'
  }

  if (values.api_token_instance.trim().length === 0) {
    field_errors.api_token_instance = 'Введите apiTokenInstance'
  }

  return field_errors
}

export function isConnectFieldInvalid(state: ConnectFormState, field: ConnectField): boolean {
  return Boolean(state.field_errors[field]) || Boolean(state.submit_error?.invalid_fields.includes(field))
}

/** Текст под полем: локальная проверка или ответ сервера. */
export function connectFieldMessage(state: ConnectFormState, field: ConnectField): string | null {
  return state.field_errors[field] ?? state.submit_error?.messages[field] ?? null
}

/**
 * Ввод в поле снимает его собственную ошибку и ответ сервера целиком (подсветку и тексты):
 * после правки данные уже другие и прежний ответ к ним не относится.
 * Ошибка соседнего поля от локальной проверки остаётся — она всё ещё актуальна.
 */
export function connectFormReducer(state: ConnectFormState, action: ConnectFormAction): ConnectFormState {
  switch (action.type) {
    case 'field_changed': {
      const { [action.field]: _removed, ...field_errors } = state.field_errors

      return {
        values: { ...state.values, [action.field]: action.value },
        field_errors,
        submit_error: null,
      }
    }
    case 'validation_failed':
      return { ...state, field_errors: action.field_errors, submit_error: null }
    case 'submit_started':
      return { ...state, field_errors: {}, submit_error: null }
    case 'submit_failed':
      return { ...state, submit_error: action.error }
  }
}
