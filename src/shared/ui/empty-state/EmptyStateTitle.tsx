import { cn } from '@heroui/react'
import type { ComponentPropsWithoutRef } from 'react'

export function EmptyStateTitle({ className, ...rest }: ComponentPropsWithoutRef<'p'>) {
  return <p className={cn('text-base font-medium text-foreground', className)} {...rest} />
}
