import { useMutation } from '@tanstack/react-query'

import {
  sendMessage,
  type SendMessageError,
  type SendMessageInput,
  type SendMessageResult,
} from '@/features/send-message/model/send-message'

/** Оптимистичное сообщение добавляется в стор сразу; UI читает статус из стора, а не из мутации. */
export function useSendMessage() {
  return useMutation<SendMessageResult, SendMessageError, SendMessageInput>({
    mutationFn: sendMessage,
  })
}
