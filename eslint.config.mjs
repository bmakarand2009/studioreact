import js from '@eslint/js';

export default [
  {
    ignores: ['**/*.config.js', '**/*.config.ts', 'dist/**', 'build/**', 'node_modules/**'],
  },
  js.configs.recommended,
];
