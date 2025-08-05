import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../apps/web/dist-frontend',
    emptyOutDir: true
  },
  server: {
    port: 3000
  }
})