import { useLayoutEffect, useRef, useState, type ClipboardEvent, type SyntheticEvent } from 'react'

import { applyPhoneMask } from '@/features/open-chat/lib/mask-phone-input'

export function usePhoneMask(phone: string, onChange: (value: string) => void) {
  const input_ref = useRef<HTMLInputElement>(null)
  const caret_ref = useRef<number | null>(null)
  const [caret_tick, setCaretTick] = useState(0)

  useLayoutEffect(() => {
    const input = input_ref.current
    const caret = caret_ref.current

    if (!input || caret === null || document.activeElement !== input) return

    if (input.value !== phone) {
      input.value = phone
    }

    input.setSelectionRange(caret, caret)
    caret_ref.current = null
  }, [phone, caret_tick])

  const publish = (raw: string, selection: number) => {
    const masked = applyPhoneMask(raw, selection, phone)
    caret_ref.current = masked.caret
    setCaretTick((tick) => tick + 1)
    onChange(masked.phone)
  }

  const handleChange = (value: string) => {
    publish(value, input_ref.current?.selectionStart ?? value.length)
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text')
    const start = input_ref.current?.selectionStart ?? phone.length
    const end = input_ref.current?.selectionEnd ?? start
    const raw = `${phone.slice(0, start)}${pasted}${phone.slice(end)}`
    publish(raw, start + pasted.length)
  }

  const handleSelect = (event: SyntheticEvent<HTMLInputElement>) => {
    const input = event.currentTarget

    if (phone.startsWith('+') && input.selectionStart === 0 && input.selectionEnd === 0) {
      input.setSelectionRange(1, 1)
    }
  }

  return { input_ref, handleChange, handlePaste, handleSelect }
}
