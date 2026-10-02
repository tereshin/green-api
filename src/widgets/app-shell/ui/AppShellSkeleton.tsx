import { Skeleton } from '@heroui/react'

import { ChatListItemSkeleton } from '@/entities/chat'
import { MessageListSkeleton } from '@/entities/message'

import { AppShell } from '@/widgets/app-shell/ui/AppShell'

const SIDEBAR_ROWS = 6

export function AppShellSkeleton() {
  return (
    <AppShell
      is_content_active={false}
      navigation={
        <div className="flex w-full items-center gap-3 px-3 py-2 md:flex-col md:px-0 md:py-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-24 rounded-lg md:hidden" />
        </div>
      }
      sidebar={
        <div className="flex flex-col gap-1 p-2">
          <Skeleton className="mx-2 mb-2 mt-2 h-5 w-20 rounded-lg" />
          {Array.from({ length: SIDEBAR_ROWS }, (_, index) => (
            <ChatListItemSkeleton key={index} />
          ))}
        </div>
      }
      content={
        <div className="flex min-h-0 flex-1 flex-col justify-end">
          <MessageListSkeleton />
        </div>
      }
    />
  )
}
