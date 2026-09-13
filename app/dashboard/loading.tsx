export default function DashboardLoading() {
  return (
    <main style={{ minHeight: '100vh', background: '#f6f7f9', padding: '32px max(16px,calc((100vw - 1050px)/2))', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: 1050, margin: '0 auto' }}>
        <div style={{ height: 22, width: 90, background: '#e5e7eb', borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 34, width: 180, background: '#e5e7eb', borderRadius: 8, marginBottom: 28 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>
          {[1, 2, 3, 4].map((item) => <div key={item} style={{ height: 100, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14 }} />)}
        </div>
      </div>
    </main>
  );
}
