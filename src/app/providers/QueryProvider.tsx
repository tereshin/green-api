import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type PropsWithChildren } from 'react'

/**
 * Query-слой управляет только состоянием запросов и мутаций.
 * Данные чата (чаты, сообщения) живут в Zustand-сторах entities и в кэше не дублируются.
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 2,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        // sendMessage не идемпотентен: повтор может отправить сообщение дважды.
        retry: false,
      },
    },
  })
}

export function QueryProvider({ children }: PropsWithChildren) {
  const [query_client] = useState(createQueryClient)

  return <QueryClientProvider client={query_client}>{children}</QueryClientProvider>
}
