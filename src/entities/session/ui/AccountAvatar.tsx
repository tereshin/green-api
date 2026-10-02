import { Avatar, Popover } from '@heroui/react'

import { UserIcon } from '@/shared/ui/icons'

import { getAccountInitials, getAccountTitle } from '@/entities/session/lib/account-label'
import type { Account } from '@/entities/session/model/types'

type AccountAvatarProps = {
  account: Account
  id_instance: string
}

function renderAccountFace(account: Account) {
  const initials = getAccountInitials(account)

  return (
    <Avatar color="accent">
      {account.avatar_url ? <Avatar.Image alt="" src={account.avatar_url} /> : null}
      <Avatar.Fallback>{initials ?? <UserIcon className="size-5" />}</Avatar.Fallback>
    </Avatar>
  )
}

export function AccountAvatar({ account, id_instance }: AccountAvatarProps) {
  const title = getAccountTitle(account)
  const aria_label = title ?? `Инстанс ${id_instance}`

  return (
    <Popover>
      <Popover.Trigger aria-label={aria_label}>{renderAccountFace(account)}</Popover.Trigger>
      <Popover.Content placement="right">
        <Popover.Dialog>
          <div className="flex items-center gap-3">
            {renderAccountFace(account)}
            <div className="flex min-w-0 flex-col">
              {title ? <span className="truncate text-sm font-medium">{title}</span> : null}
              <span className="truncate text-xs text-muted">Инстанс {id_instance}</span>
            </div>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}
