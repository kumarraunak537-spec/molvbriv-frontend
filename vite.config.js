import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    fs: {
      allow: [
        // Allow serving files from one level up to the project root
        '../../../../../'
      ]
    }
  }
})
