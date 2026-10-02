export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

type MessageBase = {
  id: string
  chat_id: string
  text: string
  /** Unix-время в миллисекундах. */
  timestamp: number
}

export type IncomingMessage = MessageBase & { direction: 'incoming' }

export type OutgoingMessage = MessageBase & { direction: 'outgoing'; status: MessageStatus }

export type Message = IncomingMessage | OutgoingMessage
