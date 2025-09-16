import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          motion: ['motion/react'],
          ui: ['lucide-react', new RegExp('components/ui/.*')]
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})