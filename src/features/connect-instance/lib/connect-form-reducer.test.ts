import { describe, expect, it } from 'vitest'

import { getConnectFailureMessage } from '@/features/connect-instance/lib/connect-failure-message'
import {
  connectFieldMessage,
  connectFormReducer,
  INITIAL_CONNECT_FORM_STATE,
  isConnectFieldInvalid,
  validateConnectForm,
  type ConnectFormState,
} from '@/features/connect-instance/lib/connect-form-reducer'

const FILLED_STATE: ConnectFormState = {
  ...INITIAL_CONNECT_FORM_STATE,
  values: { id_instance: '1101000001', api_token_instance: 'token' },
}

describe('validateConnectForm', () => {
  it('requires both fields', () => {
    expect(validateConnectForm(INITIAL_CONNECT_FORM_STATE.values)).toEqual({
      id_instance: 'Введите idInstance',
      api_token_instance: 'Введите apiTokenInstance',
    })
  })

  it('rejects non-digit idInstance', () => {
    expect(validateConnectForm({ id_instance: '12a', api_token_instance: 'x' })).toEqual({
      id_instance: 'idInstance состоит только из цифр',
    })
  })

  it('accepts valid values with surrounding spaces', () => {
    expect(validateConnectForm({ id_instance: ' 123 ', api_token_instance: ' x ' })).toEqual({})
  })
})

describe('connectFormReducer', () => {
  it('typing into a field clears only that field error', () => {
    const invalid = connectFormReducer(INITIAL_CONNECT_FORM_STATE, {
      type: 'validation_failed',
      field_errors: validateConnectForm(INITIAL_CONNECT_FORM_STATE.values),
    })

    expect(isConnectFieldInvalid(invalid, 'id_instance')).toBe(true)
    expect(isConnectFieldInvalid(invalid, 'api_token_instance')).toBe(true)

    const next = connectFormReducer(invalid, { type: 'field_changed', field: 'id_instance', value: '1' })

    expect(next.values.id_instance).toBe('1')
    expect(isConnectFieldInvalid(next, 'id_instance')).toBe(false)
    expect(isConnectFieldInvalid(next, 'api_token_instance')).toBe(true)
  })

  it('invalid credentials highlight both fields and put the text under the token', () => {
    const failed = connectFormReducer(FILLED_STATE, {
      type: 'submit_failed',
      error: getConnectFailureMessage({ reason: 'invalid_credentials' }),
    })

    expect(connectFieldMessage(failed, 'id_instance')).toBeNull()
    expect(connectFieldMessage(failed, 'api_token_instance')).toMatch(/^Неверные учётные данные/)
    expect(isConnectFieldInvalid(failed, 'id_instance')).toBe(true)
    expect(isConnectFieldInvalid(failed, 'api_token_instance')).toBe(true)

    const next = connectFormReducer(failed, { type: 'field_changed', field: 'api_token_instance', value: 'token2' })

    expect(next.submit_error).toBeNull()
    expect(isConnectFieldInvalid(next, 'id_instance')).toBe(false)
    expect(isConnectFieldInvalid(next, 'api_token_instance')).toBe(false)
  })

  it('an unauthorized instance highlights only idInstance and writes the error there', () => {
    const failed = connectFormReducer(FILLED_STATE, {
      type: 'submit_failed',
      error: getConnectFailureMessage({ reason: 'instance_not_authorized', state_instance: 'notAuthorized' }),
    })

    expect(connectFieldMessage(failed, 'id_instance')).toBe(
      'Инстанс не авторизован. Состояние инстанса: notAuthorized. Авторизуйте Telegram-аккаунт в личном кабинете и повторите вход.',
    )
    expect(connectFieldMessage(failed, 'api_token_instance')).toBeNull()
    expect(isConnectFieldInvalid(failed, 'id_instance')).toBe(true)
    expect(isConnectFieldInvalid(failed, 'api_token_instance')).toBe(false)
  })

  it('a repeated failure after editing shows the error again', () => {
    const error = getConnectFailureMessage({ reason: 'invalid_credentials' })
    const failed = connectFormReducer(FILLED_STATE, { type: 'submit_failed', error })
    const edited = connectFormReducer(failed, { type: 'field_changed', field: 'id_instance', value: '42' })
    const started = connectFormReducer(edited, { type: 'submit_started' })

    expect(started.submit_error).toBeNull()
    expect(connectFormReducer(started, { type: 'submit_failed', error }).submit_error).toEqual(error)
  })

  it('a network failure is shown under the token field', () => {
    const failed = connectFormReducer(FILLED_STATE, {
      type: 'submit_failed',
      error: getConnectFailureMessage({ reason: 'network' }),
    })

    expect(connectFieldMessage(failed, 'api_token_instance')).toMatch(/^Нет соединения/)
    expect(isConnectFieldInvalid(failed, 'id_instance')).toBe(false)
    expect(isConnectFieldInvalid(failed, 'api_token_instance')).toBe(true)
  })
})
