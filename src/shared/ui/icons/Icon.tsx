import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement>

/** Базовый контур 24×24: размер задаётся классом (`size-5`), цвет наследуется через currentColor. */
export function Icon({ children, className, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className ?? 'size-5'}
      {...rest}
    >
      {children}
    </svg>
  )
}
