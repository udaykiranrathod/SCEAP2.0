import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Bind to all interfaces and use the PORT env when available so the
    // dev server is reachable from remote/devcontainer environments (Codespaces).
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
    // During local development, proxy `/api` requests to the backend running on localhost:8000
    // This avoids CORS problems when the frontend is served from a different host (Codespaces).
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
