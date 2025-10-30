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
    'process.env': {}, // safety guard if any stray usage remains in client
  },
  server: {
    host: true,
    port: 8080,
    open: false,
  },
  preview: {
    host: true,
    port: 8080,
  },
});