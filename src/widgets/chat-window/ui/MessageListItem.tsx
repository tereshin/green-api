import { MessageBubble, useMessageStore } from '@/entities/message'

export function MessageListItem({ message_id }: { message_id: string }) {
  const message = useMessageStore((state) => state.message_by_id[message_id])
  return message ? <MessageBubble message={message} /> : null
}
