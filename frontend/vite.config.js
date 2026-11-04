import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  envDir: '../',
  envPrefix: ['VITE_', 'REACT_APP_'],
  plugins: [react()],
  define: {
    'process.env.REACT_APP_GIPHY_API_KEY': JSON.stringify(process.env.REACT_APP_GIPHY_API_KEY || '')
  },
  server: {
    port: 5173,
    watch: {
      ignored: ['**/data/**', '**/backend/**', '**/node_modules/**'],
    },
    proxy: {
      // Proxy all /api requests to the Express backend during development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
