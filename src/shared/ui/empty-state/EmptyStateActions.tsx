import { cn } from '@heroui/react'
import type { ComponentPropsWithoutRef } from 'react'

export function EmptyStateActions({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('mt-1 flex flex-wrap items-center justify-center gap-2', className)} {...rest} />
}
