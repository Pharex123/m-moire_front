import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // autorise l'accès extérieur
    allowedHosts: [
      '8d8b-41-79-219-198.ngrok-free.app' // ← remplace par ton URL ngrok
    ]
  }
})


