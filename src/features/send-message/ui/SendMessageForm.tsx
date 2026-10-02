import { Alert, Button, FieldError, Form, TextArea, TextField } from '@heroui/react'
import { useRef } from 'react'

import { SendIcon } from '@/shared/ui/icons'

import { useSendMessageForm } from '@/features/send-message/model/useSendMessageForm'
import { useTextareaAutosize } from '@/shared/lib/dom'

const MAX_VISIBLE_ROWS = 6

type SendMessageFormProps = {
  chat_id: string
}

export function SendMessageForm({ chat_id }: SendMessageFormProps) {
  const textarea_ref = useRef<HTMLTextAreaElement>(null)
  const { text, send_error, length_error, is_send_disabled, is_pending, handleTextChange, handleSubmit, handleKeyDown } =
    useSendMessageForm(chat_id)

  useTextareaAutosize(textarea_ref, text, MAX_VISIBLE_ROWS)

  return (
    <Form validationBehavior="aria" className="flex flex-col gap-2" onSubmit={handleSubmit}>
      {send_error ? (
        <Alert status="danger" className="shadow-none">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Сообщение не отправлено</Alert.Title>
            <Alert.Description>{send_error}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <div className="flex items-end gap-2">
        <TextField
          fullWidth
          autoFocus
          name="message"
          aria-label="Сообщение"
          className="min-w-0 flex-1"
          value={text}
          isInvalid={length_error !== null}
          onChange={handleTextChange}
        >
          <TextArea
            ref={textarea_ref}
            rows={1}
            variant="secondary"
            placeholder="Сообщение"
            className="resize-none"
            onKeyDown={handleKeyDown}
          />
          {length_error ? <FieldError>{length_error}</FieldError> : null}
        </TextField>

        <Button type="submit" isIconOnly aria-label="Отправить" isDisabled={is_send_disabled} isPending={is_pending}>
          <SendIcon className="size-5" />
        </Button>
      </div>
    </Form>
  )
}
