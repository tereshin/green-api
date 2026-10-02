import { useState, type SyntheticEvent, type KeyboardEvent } from 'react'

import { MAX_MESSAGE_LENGTH } from '@/entities/message'

import { getSendFailureMessage } from '@/features/send-message/lib/send-failure-message'
import { useSendMessage } from '@/features/send-message/model/useSendMessage'

const COARSE_POINTER_QUERY = '(pointer: coarse)'

export function useSendMessageForm(chat_id: string) {
  const [text, setText] = useState('')
  const [send_error, setSendError] = useState<string | null>(null)
  const mutation = useSendMessage()

  const trimmed_length = text.trim().length
  const is_too_long = trimmed_length > MAX_MESSAGE_LENGTH
  const is_send_disabled = trimmed_length === 0 || is_too_long
  const can_send = !is_send_disabled && !mutation.isPending

  const handleTextChange = (value: string) => {
    setText(value)
    setSendError(null)
  }

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!can_send) {
      return
    }

    // Оптимистичное сообщение уже в ленте, поле очищается сразу; при ошибке пузырь станет «Не отправлено».
    setText('')
    setSendError(null)
    mutation.mutate(
      { chat_id, text },
      { onError: (error) => setSendError(getSendFailureMessage(error.failure)) },
    )
  }

  /** На desktop Enter отправляет, Shift+Enter — перенос; на тач-устройствах Enter всегда перенос. */
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return
    }

    if (window.matchMedia(COARSE_POINTER_QUERY).matches) {
      return
    }

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  return {
    text,
    send_error,
    length_error: is_too_long ? `Сообщение длиннее ${MAX_MESSAGE_LENGTH} символов (${trimmed_length})` : null,
    is_send_disabled,
    is_pending: mutation.isPending,
    handleTextChange,
    handleSubmit,
    handleKeyDown,
  }
}
