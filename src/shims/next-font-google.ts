// Shim for next/font/google
// In a Vite/React app, we handle fonts via CSS imports instead

export function Inter(config?: any) {
  return {
    className: 'font-sans',
    style: { fontFamily: 'Inter, sans-serif' },
    variable: '--font-inter',
  };
}

export function Roboto(config?: any) {
  return {
    className: 'font-sans',
    style: { fontFamily: 'Roboto, sans-serif' },
    variable: '--font-roboto',
  };
}

// Add other Google Fonts as needed
export function Poppins(config?: any) {
  return {
    className: 'font-sans',
    style: { fontFamily: 'Poppins, sans-serif' },
    variable: '--font-poppins',
  };
}
