import { lazy } from 'react'

export const LoginPage = lazy(() => import('@/pages/login/ui/LoginPage'))
export { LoginPageSkeleton } from '@/pages/login/ui/LoginPageSkeleton'
export { RestoreSessionPage } from '@/pages/login/ui/RestoreSessionPage'
