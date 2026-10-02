import { Card, Skeleton } from '@heroui/react'

export function LoginPageSkeleton() {
  return (
    <div aria-hidden="true" className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-sm border border-separator shadow-none">
        <Card.Header className="gap-2">
          <Skeleton className="h-5 w-40 rounded-lg" />
          <Skeleton className="h-3 w-full rounded-lg" />
        </Card.Header>
        <Card.Content className="gap-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-full" />
        </Card.Content>
      </Card>
    </div>
  )
}
