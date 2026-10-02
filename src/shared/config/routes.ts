export const LOGIN_PATH = '/login'
export const CHATS_PATH = '/chats'

export function chatPath(chat_id: string): string {
  return `${CHATS_PATH}/${encodeURIComponent(chat_id)}`
}

/** Только свои экраны чатов: чужой путь из location.state не используем как редирект. */
export function isChatsPath(path: string): boolean {
  return path === CHATS_PATH || path.startsWith(`${CHATS_PATH}/`)
}
