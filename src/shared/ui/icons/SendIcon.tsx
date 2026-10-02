import { Icon, type IconProps } from '@/shared/ui/icons/Icon'

export function SendIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4 20-7Z" />
    </Icon>
  )
}
