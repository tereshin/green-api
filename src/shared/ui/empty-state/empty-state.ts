import { EmptyStateActions } from '@/shared/ui/empty-state/EmptyStateActions'
import { EmptyStateDescription } from '@/shared/ui/empty-state/EmptyStateDescription'
import { EmptyStateIcon } from '@/shared/ui/empty-state/EmptyStateIcon'
import { EmptyStateRoot } from '@/shared/ui/empty-state/EmptyStateRoot'
import { EmptyStateTitle } from '@/shared/ui/empty-state/EmptyStateTitle'

export const EmptyState = Object.assign(EmptyStateRoot, {
  Icon: EmptyStateIcon,
  Title: EmptyStateTitle,
  Description: EmptyStateDescription,
  Actions: EmptyStateActions,
})
