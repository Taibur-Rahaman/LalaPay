import { notFound } from 'next/navigation';

type PaymentLink = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  description?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  expiresAt?: string | null;
  paymentMethods: ('bkash' | 'nagad')[];
  status: string;
};

async function getPaymentLink(id: string): Promise<PaymentLink | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) throw new Error('NEXT_PUBLIC_API_URL is not configured');

  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/api/v1/payment-links/${encodeURIComponent(id)}`, {
    cache: 'no-store',
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Unable to load payment link');

  const body = await response.json();
  return body.success ? body.data : null;
}

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await getPaymentLink(id);

  if (!payment) notFound();

  const expired = payment.status === 'EXPIRED';

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f6f7f9' }}>
      <section style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 12px 40px rgba(0,0,0,.08)' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .55 }}>LalaPay</div>
          <h1 style={{ margin: '10px 0 8px', fontSize: 28 }}>{payment.title}</h1>
          {payment.description && <p style={{ margin: 0, lineHeight: 1.6, opacity: .7 }}>{payment.description}</p>}
        </div>

        <div style={{ padding: 20, borderRadius: 14, background: '#f6f7f9', marginBottom: 22 }}>
          <div style={{ fontSize: 13, opacity: .6 }}>Amount to pay</div>
          <div style={{ marginTop: 4, fontSize: 34, fontWeight: 800 }}>
            {payment.currency} {payment.amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {expired ? (
          <div style={{ padding: 14, borderRadius: 12, background: '#fff1f1', color: '#b42318', fontWeight: 600 }}>
            This payment link has expired.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Choose a payment method</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {payment.paymentMethods.map((method) => (
                <button key={method} disabled style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #ddd', background: '#fff', textAlign: 'left', fontSize: 16, fontWeight: 700, cursor: 'not-allowed' }}>
                  {method === 'bkash' ? 'bKash' : 'Nagad'}
                  <span style={{ float: 'right', fontSize: 12, opacity: .45, fontWeight: 500 }}>Coming next</span>
                </button>
              ))}
            </div>
            <p style={{ margin: '16px 0 0', fontSize: 12, lineHeight: 1.5, opacity: .5 }}>
              Secure payment processing by LalaPay. Payment execution will be enabled after provider integration.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
