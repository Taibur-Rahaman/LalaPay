export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui', background: '#f6f7f9' }}>
      <section style={{ textAlign: 'center', width: 'min(460px,100%)' }}>
        <strong style={{ fontSize: 20 }}>LalaPay</strong>
        <h1 style={{ fontSize: 42, margin: '18px 0 8px' }}>404</h1>
        <p style={{ color: '#555' }}>This page does not exist.</p>
        <a href="/" style={{ fontWeight: 800 }}>Go home</a>
      </section>
    </main>
  );
}
