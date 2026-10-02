import { Button } from '@heroui/react'

import { AppProviders } from '@/app/providers'

export function App() {
  return (
    <AppProviders>
      <main className="flex flex-col items-start gap-4 p-6">
        <h1 className="text-2xl font-semibold">green-api</h1>
        <Button>Hello HeroUI</Button>
      </main>
    </AppProviders>
  )
}
