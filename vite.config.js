import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react'
            }
            if (id.includes('html2pdf') || id.includes('jspdf') || id.includes('html2canvas') || id.includes('pdf-parse')) {
              return 'vendor-pdf'
            }
            if (id.includes('html5-qrcode') || id.includes('jsbarcode')) {
              return 'vendor-scanner-barcode'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            return 'vendor-others'
          }
        },
      },
    },
  },
})

