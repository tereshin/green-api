import { Card } from '@heroui/react'

import { ConnectInstanceForm } from '@/features/connect-instance'

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-sm shadow-none">
        <Card.Header>
          <Card.Title className="text-lg font-semibold mb-1">Вход</Card.Title>
          <Card.Description>Введите учётные данные инстанса из личного кабинета GREEN-API.</Card.Description>
        </Card.Header>
        <Card.Content>
          <ConnectInstanceForm />
        </Card.Content>
      </Card>
    </div>
  )
}
