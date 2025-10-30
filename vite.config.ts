import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(async ({ mode }) => {
  const plugins: PluginOption[] = [react()];
  
  if (mode === 'development') {
    const { componentTagger } = await import('lovable-tagger');
    plugins.push(componentTagger());
  }
  
  return {
    plugins,
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
      host: '::',
      port: 8080,
      open: true,
    },
  };
});