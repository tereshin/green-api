import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Vite 8 (Rolldown): manualChunks принимает только функцию.
        manualChunks: (id) => {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) {
            return 'react'
          }

          return undefined
        },
      },
    },
  },
})
