export default function PaymentLoading() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f6f7f9', fontFamily: 'system-ui' }}>
      <section style={{ width: '100%', maxWidth: 520, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: 28, boxShadow: '0 10px 30px rgba(0,0,0,.06)' }} aria-busy="true">
        <div style={{ height: 22, width: 90, background: '#e5e7eb', borderRadius: 8, marginBottom: 20 }} />
        <div style={{ height: 32, width: '70%', background: '#e5e7eb', borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 20, width: '45%', background: '#e5e7eb', borderRadius: 8, marginBottom: 28 }} />
        <div style={{ height: 48, background: '#f0f1f3', borderRadius: 10 }} />
      </section>
    </main>
  );
}
