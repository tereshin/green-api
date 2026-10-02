import { Skeleton } from '@heroui/react'

export function ChatListItemSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3 px-3 py-2">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-3/5 rounded-lg" />
        <Skeleton className="h-3 w-4/5 rounded-lg" />
      </div>
    </div>
  )
}
