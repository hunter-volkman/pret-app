import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // Use root base path for proper asset linking
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'leaflet'],
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
