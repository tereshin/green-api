import { cn } from '@heroui/react'
import type { ComponentPropsWithoutRef } from 'react'

export function EmptyStateIcon({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex size-14 items-center justify-center rounded-full bg-default text-muted', className)}
      {...rest}
    />
  )
}
