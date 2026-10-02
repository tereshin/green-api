import { useMutation } from '@tanstack/react-query'

import { loadOlderChatHistory, useMessageStore } from '@/entities/message'

export function useOlderChatHistory(chat_id: string) {
  const has_more = useMessageStore((state) => state.history_by_chat_id[chat_id]?.has_more ?? false)
  const mutation = useMutation({ mutationFn: () => loadOlderChatHistory(chat_id), retry: false })

  return {
    has_more,
    is_loading: mutation.isPending,
    is_error: mutation.isError,
    loadMore: () => {
      if (has_more && !mutation.isPending) mutation.mutate()
    },
  }
}
