import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import handler from './api/pqrs.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-pqrs-dev-server',
      configureServer(server) {
        server.middlewares.use('/api/pqrs', (req, res) => {
          handler(req, res)
        })
      },
    },
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

