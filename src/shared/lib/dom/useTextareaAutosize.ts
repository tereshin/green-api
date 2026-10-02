import { useLayoutEffect, type RefObject } from 'react'

/** `field-sizing: content` пока не везде поддерживается, поэтому высота считается вручную (box-sizing: border-box). */
export function useTextareaAutosize(ref: RefObject<HTMLTextAreaElement | null>, value: string, max_rows: number): void {
  useLayoutEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    const style = getComputedStyle(element)
    const borders = Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth)
    const paddings = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
    const line_height = Number.parseFloat(style.lineHeight) || 20
    const max_height = line_height * max_rows + paddings + borders

    element.style.height = 'auto'
    const content_height = element.scrollHeight + borders

    element.style.height = `${Math.min(content_height, max_height)}px`
    element.style.overflowY = content_height > max_height ? 'auto' : 'hidden'
  }, [ref, value, max_rows])
}
