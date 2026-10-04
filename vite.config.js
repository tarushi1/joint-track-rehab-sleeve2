import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Proxy /blynk/* requests to Blynk Cloud to avoid CORS issues
    proxy: {
      '/blynk': {
        target: 'https://blynk.cloud',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/blynk/, '')
      }
    }
  }
})
