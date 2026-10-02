import { useIsMutating, useMutation } from '@tanstack/react-query'

import { openChat, type OpenChatError, type OpenChatResult } from '@/features/open-chat/model/open-chat'

const OPEN_CHAT_MUTATION_KEY = ['open-chat'] as const

/** Переменная мутации — номер телефона в свободном формате. */
export function useOpenChat() {
  return useMutation<OpenChatResult, OpenChatError, string>({
    mutationKey: OPEN_CHAT_MUTATION_KEY,
    mutationFn: openChat,
  })
}

/** Открытие чата идёт в модалке. Окно чата может показать скелетон, список чатов — нет. */
export function useIsOpeningChat(): boolean {
  return useIsMutating({ mutationKey: OPEN_CHAT_MUTATION_KEY }) > 0
}
