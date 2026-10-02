import { useLayoutEffect, useRef, type RefObject } from 'react'

/** Порог в px, при котором пользователь считается «внизу» ленты. */
const BOTTOM_THRESHOLD = 80

/**
 * Прокручивает ленту вниз при новом сообщении, если пользователь уже был внизу
 * или сам отправил сообщение; иначе не мешает читать историю.
 */
export function useAutoScroll(
  container_ref: RefObject<HTMLElement | null>,
  last_message_key: string | null,
  is_last_outgoing: boolean,
) {
  const is_at_bottom_ref = useRef(true)

  useLayoutEffect(() => {
    const container = container_ref.current

    if (!container || !last_message_key) {
      return
    }

    if (is_at_bottom_ref.current || is_last_outgoing) {
      container.scrollTo({ top: container.scrollHeight })
      is_at_bottom_ref.current = true
    }
  }, [container_ref, last_message_key, is_last_outgoing])

  const handleScroll = () => {
    const container = container_ref.current

    if (container) {
      is_at_bottom_ref.current = container.scrollHeight - container.scrollTop - container.clientHeight < BOTTOM_THRESHOLD
    }
  }

  return { handleScroll }
}
