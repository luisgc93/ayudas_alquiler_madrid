import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/ayudas_alquiler_madrid/',
  plugins: [react(), tailwindcss()],
})
