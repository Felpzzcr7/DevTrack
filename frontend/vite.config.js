import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // em desenvolvimento, chamadas para /api vão para o backend na porta 3000
    proxy: { '/api': 'http://localhost:3000' },
  },
})
