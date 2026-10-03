import { Button, FieldError, Form, Input, Modal, TextField } from '@heroui/react'

import { useNewChatForm } from '@/features/open-chat/model/useNewChatForm'

const FORM_ID = 'new-chat-form'

type NewChatModalProps = {
  is_open: boolean
  onOpenChange: (is_open: boolean) => void
  onChatOpened: (chat_id: string) => void
}

export function NewChatModal({ is_open, onOpenChange, onChatOpened }: NewChatModalProps) {
  const { phone, field_error, submit_error, is_pending, handlePhoneChange, handleSubmit, reset } = useNewChatForm({
    onOpened: (chat_id) => {
      onOpenChange(false)
      onChatOpened(chat_id)
    },
  })
  const error_message = field_error ?? submit_error?.description ?? null

  const handleOpenChange = (next_is_open: boolean) => {
    if (!next_is_open) {
      reset()
    }

    onOpenChange(next_is_open)
  }

  return (
    <Modal.Backdrop isOpen={is_open} onOpenChange={handleOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[400px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Новое сообщение</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <Form id={FORM_ID} validationBehavior="aria" className="flex flex-col gap-3" onSubmit={handleSubmit}>
              <p className="text-sm text-muted">Введите номер получателя в международном формате.</p>
              <TextField
                fullWidth
                autoFocus
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-label="Номер телефона"
                value={phone}
                isInvalid={error_message !== null}
                isDisabled={is_pending}
                onChange={handlePhoneChange}
              >
                <Input variant="secondary" placeholder="+7 937 999 48 33" />
                {error_message ? <FieldError>{error_message}</FieldError> : null}
              </TextField>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="tertiary">
              Отмена
            </Button>
            <Button type="submit" form={FORM_ID} isPending={is_pending}>
              {is_pending ? 'Открываем…' : 'Создать чат'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
