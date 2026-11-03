import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // El bundle principal pesa ~520 kB (155 kB comprimido): es normal para esta app y se sube el umbral
  // del aviso para que `pnpm build` termine sin mensajes que parezcan errores.
  build: { chunkSizeWarningLimit: 700 },
})
