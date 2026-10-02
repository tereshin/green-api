import { AccountAvatar, useSessionStore } from '@/entities/session'

import { LogoutButton } from '@/features/disconnect-instance'

/** Desktop — вертикальная колонка, mobile — верхняя панель: аватар и выход. */
export function NavigationRail() {
  const account = useSessionStore((state) => (state.session.status === 'authorized' ? state.session.account : null))
  const id_instance = useSessionStore((state) => (state.session.status === 'authorized' ? state.session.id_instance : null))

  if (!account || !id_instance) {
    return null
  }

  return (
    <div className="flex w-full items-center justify-between gap-3 px-3 py-2 md:flex-col md:justify-start md:px-0 md:py-4">
      <AccountAvatar account={account} id_instance={id_instance} />

      <div className="md:mt-auto">
        <LogoutButton />
      </div>
    </div>
  )
}
