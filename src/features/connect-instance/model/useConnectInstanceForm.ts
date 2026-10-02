import { useReducer, type SyntheticEvent } from 'react'

import { getConnectFailureMessage } from '@/features/connect-instance/lib/connect-failure-message'
import {
  connectFieldMessage,
  connectFormReducer,
  INITIAL_CONNECT_FORM_STATE,
  isConnectFieldInvalid,
  validateConnectForm,
  type ConnectField,
  type ConnectFieldErrors,
} from '@/features/connect-instance/lib/connect-form-reducer'
import { useConnectInstance } from '@/features/connect-instance/model/useConnectInstance'

export function useConnectInstanceForm() {
  const [state, dispatch] = useReducer(connectFormReducer, INITIAL_CONNECT_FORM_STATE)
  const mutation = useConnectInstance()

  const handleFieldChange = (field: ConnectField, value: string) => {
    const next_value = field === 'id_instance' ? value.replace(/\D/g, '') : value

    dispatch({ type: 'field_changed', field, value: next_value })

    if (mutation.isError) {
      mutation.reset()
    }
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (mutation.isPending) {
      return
    }

    const field_errors = validateConnectForm(state.values)

    if (Object.keys(field_errors).length > 0) {
      dispatch({ type: 'validation_failed', field_errors })

      return
    }

    dispatch({ type: 'submit_started' })
    mutation.mutate(state.values, {
      onError: (error) => dispatch({ type: 'submit_failed', error: getConnectFailureMessage(error.failure) }),
    })
  }

  const field_errors: ConnectFieldErrors = {
    id_instance: connectFieldMessage(state, 'id_instance') ?? undefined,
    api_token_instance: connectFieldMessage(state, 'api_token_instance') ?? undefined,
  }

  return {
    values: state.values,
    field_errors,
    is_pending: mutation.isPending,
    isFieldInvalid: (field: ConnectField) => isConnectFieldInvalid(state, field),
    handleFieldChange,
    handleSubmit,
  }
}
