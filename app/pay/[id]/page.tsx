'use client';

import { useEffect, useState } from 'react';

type PaymentLink = { id: string; title: string; amount: number; currency: string; description?: string | null; expiresAt?: string | null; paymentMethods: ('bkash' | 'nagad')[]; status: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

function createIdempotencyKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('');
  const [payment, setPayment] = useState<PaymentLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState<string | null>(null);
  const [idempotencyKeys] = useState(() => ({ bkash: createIdempotencyKey(), nagad: createIdempotencyKey() }));

  useEffect(() => { params.then(({ id: value }) => setId(value)); }, [params]);
  useEffect(() => {
    if (!id) return;
    if (!API_URL) { setError('Payment service is not configured.'); setLoading(false); return; }
    fetch(`${API_URL}/api/v1/payment-links/${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then(async (r) => { if (r.status === 404) throw new Error('Payment link not found.'); if (!r.ok) throw new Error('Unable to load payment link.'); return r.json(); })
      .then((body) => { if (!body.success) throw new Error('Unable to load payment link.'); setPayment(body.data); })
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load payment link.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function pay(method: 'bkash' | 'nagad') {
    if (!API_URL || !payment || paying) return;
    setPaying(method); setError('');
    try {
      const response = await fetch(`${API_URL}/api/v1/payment-links/${encodeURIComponent(payment.id)}/pay/${method}`, {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKeys[method] },
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || `Unable to start ${method} payment.`);
      if (body.data?.redirectUrl) window.location.assign(body.data.redirectUrl);
      else throw new Error('Payment provider did not return a redirect URL.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Payment could not be started.'); setPaying(null); }
  }

  if (loading) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui' }}>Loading payment...</main>;
  if (error && !payment) return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui' }}><section><h1>Payment unavailable</h1><p>{error}</p></section></main>;
  if (!payment) return null;

  const expired = payment.status === 'EXPIRED';
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f6f7f9', fontFamily: 'system-ui' }}>
    <section style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 12px 40px rgba(0,0,0,.08)' }}>
      <div style={{ marginBottom: 24 }}><div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .55 }}>LalaPay</div><h1 style={{ margin: '10px 0 8px', fontSize: 28 }}>{payment.title}</h1>{payment.description && <p style={{ margin: 0, lineHeight: 1.6, opacity: .7 }}>{payment.description}</p>}</div>
      <div style={{ padding: 20, borderRadius: 14, background: '#f6f7f9', marginBottom: 22 }}><div style={{ fontSize: 13, opacity: .6 }}>Amount to pay</div><div style={{ marginTop: 4, fontSize: 34, fontWeight: 800 }}>{payment.currency} {payment.amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
      {expired ? <div style={{ padding: 14, borderRadius: 12, background: '#fff1f1', color: '#b42318', fontWeight: 600 }}>This payment link has expired.</div> : <><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Choose a payment method</div><div style={{ display: 'grid', gap: 10 }}>{payment.paymentMethods.map((method) => <button key={method} onClick={() => pay(method)} disabled={!!paying} style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #ddd', background: '#fff', textAlign: 'left', fontSize: 16, fontWeight: 700, cursor: paying ? 'wait' : 'pointer' }}>{paying === method ? 'Opening secure checkout…' : method === 'bkash' ? 'bKash' : 'Nagad'}<span style={{ float: 'right', fontSize: 12, opacity: .5, fontWeight: 500 }}>{paying === method ? '' : 'Pay now'}</span></button>)}</div>{error && <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: '#fff1f1', color: '#b42318', fontSize: 13 }}>{error}</div>}<p style={{ margin: '16px 0 0', fontSize: 12, lineHeight: 1.5, opacity: .5 }}>Secure payment processing by LalaPay.</p></>}
    </section>
  </main>;
}
