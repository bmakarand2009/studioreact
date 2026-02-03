import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'next/link': path.resolve(__dirname, 'src/shims/next-link.tsx'),
      'next/navigation': path.resolve(__dirname, 'src/shims/next-navigation.ts'),
      'next/font/google': path.resolve(__dirname, 'src/shims/next-font-google.ts'),
    },
  },
  define: {
    'process.env': {},
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false,
    strictPort: false,
    allowedHosts: true,
    hmr: false,
    // Proxy API in dev to avoid CORS when backend does not allow localhost origin
    proxy: {
      '/api': {
        target: 'https://api.wajooba.me',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: ['.onrender.com', 'studioreact.onrender.com','.trywajooba.com'],
  },
});