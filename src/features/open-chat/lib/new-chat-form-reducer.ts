import { normalizePhone } from '@/shared/lib/phone'

export type NewChatSubmitError = {
  title: string
  description: string
  is_phone_invalid: boolean
}

export type NewChatFormState = {
  phone: string
  field_error: string | null
  submit_error: NewChatSubmitError | null
}

export type NewChatFormAction =
  | { type: 'phone_changed'; value: string }
  | { type: 'validation_failed'; message: string }
  | { type: 'submit_started' }
  | { type: 'submit_failed'; error: NewChatSubmitError }
  | { type: 'reset' }

export const INITIAL_NEW_CHAT_FORM_STATE: NewChatFormState = {
  phone: '',
  field_error: null,
  submit_error: null,
}

/** Один плюс в начале, цифры и пробелы. Разделители вставленного номера приводим к пробелам. */
export function filterPhoneInput(value: string): string {
  return value
    .replace(/[()-]/g, ' ')
    .replace(/[^\d+\s]/g, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .replace(/\+/g, (plus, offset: number) => offset === 0 ? plus : '')
}

/** null — номер корректен. */
export function validatePhone(value: string): string | null {
  if (value.trim().length === 0) {
    return 'Введите номер телефона'
  }

  return normalizePhone(value) ? null : 'Введите международный номер: 10–15 цифр с кодом страны, например +7 937 999 48 33'
}

export function isNewChatPhoneInvalid(state: NewChatFormState): boolean {
  return state.field_error !== null || Boolean(state.submit_error?.is_phone_invalid)
}

/** Любая правка номера снимает и ошибку поля, и ошибку прошлого запроса. */
export function newChatFormReducer(state: NewChatFormState, action: NewChatFormAction): NewChatFormState {
  switch (action.type) {
    case 'phone_changed':
      return { phone: filterPhoneInput(action.value), field_error: null, submit_error: null }
    case 'validation_failed':
      return { ...state, field_error: action.message, submit_error: null }
    case 'submit_started':
      return { ...state, field_error: null, submit_error: null }
    case 'submit_failed':
      return { ...state, submit_error: action.error }
    case 'reset':
      return INITIAL_NEW_CHAT_FORM_STATE
  }
}
