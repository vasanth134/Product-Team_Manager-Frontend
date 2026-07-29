import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Check if we are executing within the monorepo setup (where node_modules is in the parent folder)
// or in standalone repository mode (where node_modules is in the current directory, e.g. on Vercel deployment)
const parentNodeModules = path.resolve(__dirname, '../node_modules')
const isMonorepo = fs.existsSync(parentNodeModules) && fs.existsSync(path.join(parentNodeModules, 'react'))

const reactPath = isMonorepo
  ? path.resolve(__dirname, '../node_modules/react')
  : path.resolve(__dirname, './node_modules/react')

const reactDomPath = isMonorepo
  ? path.resolve(__dirname, '../node_modules/react-dom')
  : path.resolve(__dirname, './node_modules/react-dom')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Force Vite to use a single copy of React from the monorepo root or local node_modules
    // This prevents "Invalid hook call" errors caused by duplicate React instances
    // (e.g. when packages installed with --legacy-peer-deps bring their own node_modules/react)
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      react: reactPath,
      'react-dom': reactDomPath,
    },
  },
})
