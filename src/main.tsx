import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/styles/globals.css';
import App from './App';
// import TestApp from './App.test';

console.log('=== MAIN.TSX: Script loaded ===');
console.log('main.tsx: React version:', React.version);

const rootElement = document.getElementById('root');
console.log('main.tsx: Root element:', rootElement);

if (!rootElement) {
  console.error('main.tsx: Root element not found!');
  document.body.innerHTML = '<div style="padding: 20px; color: red;">ERROR: Root element not found</div>';
  throw new Error('Failed to find the root element');
}

console.log('main.tsx: Creating React root...');

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('main.tsx: React root created, rendering App...');
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('main.tsx: App rendered successfully');
} catch (error) {
  console.error('main.tsx: Error during render:', error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">
    <h1>App Failed to Load</h1>
    <pre>${String(error)}</pre>
  </div>`;
}