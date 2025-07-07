import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react']
  },
  server: {
    hmr: {
      timeout: 5000
    },
    watch: {
      usePolling: true
    },
    allowedHosts:true
  }
});