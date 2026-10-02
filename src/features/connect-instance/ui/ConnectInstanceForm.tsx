import { Button, FieldError, Fieldset, Form, Input, Label, TextField } from '@heroui/react'

import { useConnectInstanceForm } from '@/features/connect-instance/model/useConnectInstanceForm'

export function ConnectInstanceForm() {
  const { values, field_errors, is_pending, isFieldInvalid, handleFieldChange, handleSubmit } = useConnectInstanceForm()

  return (
    <Form validationBehavior="aria" onSubmit={handleSubmit}>
      <Fieldset className="w-full">
        <Fieldset.Group>
          <TextField
            fullWidth
            name="id_instance"
            autoComplete="username"
            value={values.id_instance}
            isInvalid={isFieldInvalid('id_instance')}
            isDisabled={is_pending}
            onChange={(value) => handleFieldChange('id_instance', value)}
          >
            <Label>idInstance</Label>
            <Input inputMode="numeric" pattern="[0-9]*" variant="secondary" placeholder="1234567890" />
            {field_errors.id_instance ? <FieldError>{field_errors.id_instance}</FieldError> : null}
          </TextField>

          <TextField
            fullWidth
            name="api_token_instance"
            type="password"
            autoComplete="current-password"
            value={values.api_token_instance}
            isInvalid={isFieldInvalid('api_token_instance')}
            isDisabled={is_pending}
            onChange={(value) => handleFieldChange('api_token_instance', value)}
          >
            <Label>apiTokenInstance</Label>
            <Input variant="secondary" placeholder="f99c77*********" />
            {field_errors.api_token_instance ? <FieldError>{field_errors.api_token_instance}</FieldError> : null}
          </TextField>
        </Fieldset.Group>

        <Fieldset.Actions>
          <Button type="submit" isPending={is_pending}>
            {is_pending ? 'Подключение…' : 'Войти'}
          </Button>
        </Fieldset.Actions>
      </Fieldset>
    </Form>
  )
}
