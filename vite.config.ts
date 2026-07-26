import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Force Vite to use a single copy of React from the monorepo root
    // This prevents "Invalid hook call" errors caused by duplicate React instances
    // (e.g. when packages installed with --legacy-peer-deps bring their own node_modules/react)
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
})
