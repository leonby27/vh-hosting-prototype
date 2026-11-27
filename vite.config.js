import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: {
        prototype: fileURLToPath(new URL('./index.html', import.meta.url)),
        protectionUpdates: fileURLToPath(new URL('./network-protection-updates/index.html', import.meta.url)),
      },
    },
  },
})
