import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Para desenvolvimento local
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',  // Diretório de saída padrão
    assetsDir: 'assets',  // Subdiretório para assets
    base: '/',
    rollupOptions: {
      output: {
        // Garante que os nomes hashados sejam consistentes
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})