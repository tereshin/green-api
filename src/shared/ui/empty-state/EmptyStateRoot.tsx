import { cn, EmptyState as HeroEmptyState } from '@heroui/react'
import type { ComponentPropsWithoutRef } from 'react'

export function EmptyStateRoot({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return (
    <HeroEmptyState
      className={cn('flex flex-col items-center justify-center gap-3 p-6 text-center', className)}
      {...rest}
    />
  )
}
