import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//export default defineConfig({
  //plugins: [react()],
//})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- ADIÇÃO AQUI ---
  server: {
    proxy: {
      // Qualquer requisição que comece com /api será redirecionada
      '/api': {
        target: 'http://localhost:5000', // O endereço do nosso backend
        changeOrigin: true,
      },
    }
  }
  // --- FIM DA ADIÇÃO ---
})