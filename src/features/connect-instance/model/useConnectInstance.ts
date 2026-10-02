import { useMutation } from '@tanstack/react-query'

import type { InstanceCredentials } from '@/shared/api'

import {
  connectInstance,
  type ConnectInstanceError,
  type ConnectResult,
} from '@/features/connect-instance/model/connect-instance'

export function useConnectInstance() {
  return useMutation<ConnectResult, ConnectInstanceError, InstanceCredentials>({
    mutationFn: connectInstance,
  })
}
