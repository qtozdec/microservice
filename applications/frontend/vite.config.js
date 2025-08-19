import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  define: {
    'process.env.NODE_ENV': '"development"'
  },
  build: {
    outDir: 'dist',
    minify: false,
    sourcemap: true
  }
})