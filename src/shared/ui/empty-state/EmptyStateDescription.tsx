import { cn } from '@heroui/react'
import type { ComponentPropsWithoutRef } from 'react'

export function EmptyStateDescription({ className, ...rest }: ComponentPropsWithoutRef<'p'>) {
  return <p className={cn('max-w-72 text-sm text-muted', className)} {...rest} />
}
