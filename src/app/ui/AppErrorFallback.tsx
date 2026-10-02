import { Alert, Button } from '@heroui/react'

export function AppErrorFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Alert status="danger" className="shadow-none">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Что-то пошло не так</Alert.Title>
            <Alert.Description>Произошла непредвиденная ошибка. Перезагрузите страницу и войдите снова.</Alert.Description>
          </Alert.Content>
        </Alert>
        <Button fullWidth onPress={() => window.location.reload()}>
          Перезагрузить
        </Button>
      </div>
    </div>
  )
}
