export default function HomePage() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 48, fontFamily: 'Arial, sans-serif' }}>
      <h1>LalaPay</h1>
      <p>Payment links for Bangladesh businesses.</p>
      <p>Supported payment methods: bKash and Nagad.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <a href="/login">Merchant Login</a>
        <a href="/register">Create Account</a>
      </div>
    </main>
  );
}
