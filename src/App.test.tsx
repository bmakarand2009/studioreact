// Minimal test app to verify build works
export default function TestApp() {
  console.log('TestApp: Rendering');
  
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#0055a6' }}>✅ App is Loading!</h1>
      <p>If you see this, the build is working.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}
