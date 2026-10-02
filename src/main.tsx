import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Fail-fast: валидация обязательных переменных окружения до рендера.
import '@/shared/config/env'

import { App } from '@/app/App'
import '@/app/styles/index.css'

const root_element = document.getElementById('root')

if (!root_element) {
  throw new Error('Root element #root not found')
}

createRoot(root_element).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
