import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = Number(env.VITE_PORT) || 5173;

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Bind to all network interfaces for LAN / Wi-Fi access
      port,
      strictPort: true,
      cors: {
        origin: [
          /^http:\/\/localhost(:\d+)?$/,
          /^http:\/\/127\.0\.0\.1(:\d+)?$/,
          /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
          /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
          /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
        ],
        credentials: true,
      },
      headers: {
        'Access-Control-Allow-Private-Network': 'true',
      },
    },
    preview: {
      host: '0.0.0.0',
      port,
      strictPort: true,
      cors: true,
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
    },
  };
});
