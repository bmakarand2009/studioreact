import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(async ({ mode }) => {
  const plugins: any[] = [react()];
  
  if (mode === 'development') {
    const { componentTagger } = await import('lovable-tagger');
    plugins.push(componentTagger());
  }
  
  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
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