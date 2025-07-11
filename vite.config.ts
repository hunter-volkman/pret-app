import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          viam: ['@viamrobotics/sdk']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173
  }
})
