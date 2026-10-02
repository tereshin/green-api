import { useReducer, type SyntheticEvent } from 'react'

import {
  INITIAL_NEW_CHAT_FORM_STATE,
  isNewChatPhoneInvalid,
  newChatFormReducer,
  validatePhone,
} from '@/features/open-chat/lib/new-chat-form-reducer'
import { getOpenChatFailureMessage } from '@/features/open-chat/lib/open-chat-failure-message'
import { useOpenChat } from '@/features/open-chat/model/useOpenChat'

type UseNewChatFormOptions = {
  onOpened: (chat_id: string) => void
}

export function useNewChatForm({ onOpened }: UseNewChatFormOptions) {
  const [state, dispatch] = useReducer(newChatFormReducer, INITIAL_NEW_CHAT_FORM_STATE)
  const mutation = useOpenChat()

  const reset = () => {
    dispatch({ type: 'reset' })
    mutation.reset()
  }

  const handlePhoneChange = (value: string) => {
    dispatch({ type: 'phone_changed', value })

    if (mutation.isError) {
      mutation.reset()
    }
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (mutation.isPending) {
      return
    }

    const field_error = validatePhone(state.phone)

    if (field_error) {
      dispatch({ type: 'validation_failed', message: field_error })

      return
    }

    dispatch({ type: 'submit_started' })
    mutation.mutate(state.phone, {
      onSuccess: ({ chat_id }) => {
        reset()
        onOpened(chat_id)
      },
      onError: (error) => dispatch({ type: 'submit_failed', error: getOpenChatFailureMessage(error.failure) }),
    })
  }

  return {
    phone: state.phone,
    field_error: state.field_error,
    submit_error: state.submit_error,
    is_phone_invalid: isNewChatPhoneInvalid(state),
    is_pending: mutation.isPending,
    handlePhoneChange,
    handleSubmit,
    reset,
  }
}
