import { useMutation } from '@tanstack/react-query'

import { openChat, type OpenChatError, type OpenChatResult } from '@/features/open-chat/model/open-chat'

/** Переменная мутации — номер телефона в свободном формате. */
export function useOpenChat() {
  return useMutation<OpenChatResult, OpenChatError, string>({
    mutationFn: openChat,
  })
}
