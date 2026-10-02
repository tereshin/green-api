export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

type MessageBase = {
  id: string
  chat_id: string
  text: string
  /** Unix-время в миллисекундах. */
  timestamp: number
  is_deleted: boolean
  is_edited: boolean
}

export type IncomingMessage = MessageBase & { direction: 'incoming' }

export type OutgoingMessage = MessageBase & { direction: 'outgoing'; status: MessageStatus }

export type Message = IncomingMessage | OutgoingMessage

export type ChatHistoryState = {
  requested_count: number
  received_count: number
  latest_timestamp: number | null
  has_more: boolean
}
