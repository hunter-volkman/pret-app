import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFile } from 'fs/promises';

// Plugin to copy the gif.worker.js file
const copyGifWorkerPlugin = () => ({
  name: 'copy-gif-worker',
  async writeBundle() {
    const source = path.resolve(__dirname, 'node_modules/gif.js.optimized/dist/gif.worker.js');
    const destination = path.resolve(__dirname, 'build/gif.worker.js');
    try {
      await copyFile(source, destination);
      console.log('✅ Copied gif.worker.js to build directory.');
    } catch (error) {
      console.error('❌ Failed to copy gif.worker.js:', error);
    }
  },
});

export default defineConfig({
  plugins: [react(), copyGifWorkerPlugin()],
  base: '/',
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './api/shared'),
    },
  },
  server: {
    host: true,
    port: 5173
  }
})
