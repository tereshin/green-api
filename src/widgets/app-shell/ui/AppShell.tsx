import { cn } from '@heroui/react'
import type { ReactNode } from 'react'

type AppShellProps = {
  navigation: ReactNode
  sidebar: ReactNode
  content: ReactNode
  /** На мобильном видна одна колонка: список чатов или открытый чат. */
  is_content_active: boolean
}

export function AppShell({ navigation, sidebar, content, is_content_active }: AppShellProps) {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background md:flex-row">
      <nav
        aria-label="Навигация"
        className={cn(
          'shrink-0 border-separator md:flex md:w-16 md:border-r',
          is_content_active ? 'hidden' : 'flex border-b md:border-b-0',
        )}
      >
        {navigation}
      </nav>
      <aside
        aria-label="Чаты"
        className={cn(
          'min-h-0 flex-1 flex-col border-separator md:flex md:w-[360px] md:flex-none md:border-r',
          is_content_active ? 'hidden' : 'flex',
        )}
      >
        {sidebar}
      </aside>
      <main className={cn('min-h-0 min-w-0 flex-1 flex-col md:flex', is_content_active ? 'flex' : 'hidden')}>
        {content}
      </main>
    </div>
  )
}
