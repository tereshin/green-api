import { useNavigate, useParams } from 'react-router'

import { CHATS_PATH, chatPath } from '@/shared/config/routes'

import { AppShell } from '@/widgets/app-shell'
import { ChatSidebar } from '@/widgets/chat-sidebar'
import { ChatWindow } from '@/widgets/chat-window'
import { NavigationRail } from '@/widgets/navigation-rail'

import { useRoutedChat } from '@/pages/chat/model/useRoutedChat'

export default function ChatPage() {
  const { chat_id: route_chat_id } = useParams()
  const chat_id = route_chat_id ?? null
  const navigate = useNavigate()
  const { is_loading, is_missing, load_error, retry } = useRoutedChat(chat_id)

  const handleSelectChat = (next_chat_id: string) => {
    navigate(chatPath(next_chat_id))
  }

  return (
    <AppShell
      is_content_active={chat_id !== null}
      navigation={<NavigationRail />}
      sidebar={<ChatSidebar active_chat_id={chat_id} onSelectChat={handleSelectChat} />}
      content={
        <ChatWindow
          chat_id={chat_id}
          is_loading={is_loading}
          is_missing={is_missing}
          load_error={load_error}
          onRetry={retry}
          onBack={() => navigate(CHATS_PATH)}
        />
      }
    />
  )
}
