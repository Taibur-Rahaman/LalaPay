'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('LalaPay frontend error', error.message); }, [error]);
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui', background: '#f6f7f9' }}>
      <section style={{ width: 'min(460px,100%)', background: '#fff', padding: 28, borderRadius: 18, boxShadow: '0 8px 30px rgba(0,0,0,.06)' }}>
        <strong style={{ fontSize: 20 }}>LalaPay</strong>
        <h1 style={{ marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ color: '#555' }}>The page could not be loaded. Try again or return to the dashboard.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => reset()} style={button}>Try again</button>
          <a href="/dashboard" style={link}>Dashboard</a>
        </div>
      </section>
    </main>
  );
}

const button: React.CSSProperties = { border: 0, borderRadius: 10, padding: '11px 16px', fontWeight: 800, cursor: 'pointer' };
const link: React.CSSProperties = { border: '1px solid #ddd', borderRadius: 10, padding: '10px 14px', fontWeight: 700, textDecoration: 'none', color: 'inherit' };
