import { useVirtualizer } from '@tanstack/react-virtual'
import { useLayoutEffect, useRef } from 'react'

import { useMessageStore } from '@/entities/message'
import { useOlderChatHistory } from '@/features/load-chat-history'

const EMPTY_IDS: string[] = []

export function useMessageList(chat_id: string) {
  const container_ref = useRef<HTMLDivElement>(null)
  const message_ids = useMessageStore((state) => state.message_ids_by_chat_id[chat_id] ?? EMPTY_IDS)
  const last_id = message_ids.at(-1)
  const pagination = useOlderChatHistory(chat_id)
  // Virtualizer изменяет экземпляр; React Compiler должен оставить этот вызов без мемоизации.
  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useVirtualizer({
    count: message_ids.length,
    getScrollElement: () => container_ref.current,
    getItemKey: (index) => message_ids[index]!,
    estimateSize: () => 72,
    overscan: 8,
    paddingStart: 0,
    paddingEnd: 16,
    gap: 6,
    anchorTo: 'end',
    followOnAppend: true,
    scrollEndThreshold: 80,
  })

  useLayoutEffect(() => {
    virtualizer.scrollToEnd()
  }, [virtualizer])

  useLayoutEffect(() => {
    // Собственная отправка открывает конец диалога; входящие не мешают читать историю.
    if (last_id?.startsWith('temp-')) virtualizer.scrollToEnd()
  }, [last_id, virtualizer])

  const handleScroll = () => {
    const container = container_ref.current
    if (container && container.scrollTop < 80 && container.scrollHeight - container.clientHeight > 80
      && !pagination.is_error) pagination.loadMore()
  }

  return { container_ref, message_ids, virtualizer, pagination, handleScroll }
}
