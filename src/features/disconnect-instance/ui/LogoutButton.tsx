import { Button, Tooltip } from '@heroui/react'

import { LogoutIcon } from '@/shared/ui/icons'

import { useDisconnectInstance } from '@/features/disconnect-instance/model/useDisconnectInstance'

export function LogoutButton() {
  const disconnect = useDisconnectInstance()

  return (
    <Tooltip delay={300}>
      <Button isIconOnly variant="ghost" aria-label="Выйти" onPress={disconnect}>
        <LogoutIcon className="size-5" />
      </Button>
      <Tooltip.Content placement="right">Выйти</Tooltip.Content>
    </Tooltip>
  )
}
