import { cn, Skeleton } from '@heroui/react'

const SKELETON_ROWS = [
  { is_outgoing: false, width: 'w-48' },
  { is_outgoing: true, width: 'w-64' },
  { is_outgoing: false, width: 'w-36' },
  { is_outgoing: true, width: 'w-40' },
  { is_outgoing: false, width: 'w-56' },
  { is_outgoing: true, width: 'w-28' },
] as const

export function MessageListSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col justify-end gap-2 p-4">
      {SKELETON_ROWS.map((row, index) => (
        <div key={index} className={cn('flex', row.is_outgoing ? 'justify-end' : 'justify-start')}>
          <Skeleton className={cn('h-10 max-w-[70%] rounded-2xl', row.width)} />
        </div>
      ))}
    </div>
  )
}
