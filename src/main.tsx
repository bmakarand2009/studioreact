import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/styles/globals.css';
import App from './App';

console.log('main.tsx: Starting application initialization...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('main.tsx: Root element not found!');
  throw new Error('Failed to find the root element');
}

console.log('main.tsx: Root element found, creating React root...');

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('main.tsx: React root created, rendering App...');
  root.render(<App />);
  console.log('main.tsx: App rendered successfully');
} catch (error) {
  console.error('main.tsx: Error during render:', error);
}