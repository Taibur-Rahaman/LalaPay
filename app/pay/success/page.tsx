'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const transactionId = params.get('transaction');
  const [status, setStatus] = useState('Checking payment status…');
  const api = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

  useEffect(() => {
    if (!transactionId || !api) { setStatus('Payment status is unavailable.'); return; }
    let cancelled = false;
    const check = async () => {
      try {
        const response = await fetch(`${api}/api/v1/payments/${encodeURIComponent(transactionId)}`, { cache: 'no-store' });
        const body = await response.json();
        if (!cancelled) setStatus(body?.data?.status === 'SUCCESS' ? 'Payment successful' : body?.data?.status === 'FAILED' ? 'Payment failed' : 'Payment is being processed');
      } catch { if (!cancelled) setStatus('Payment status is temporarily unavailable.'); }
    };
    check();
    return () => { cancelled = true; };
  }, [transactionId, api]);

  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f6f7f9', fontFamily: 'system-ui' }}><section style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.08)' }}><div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', opacity: .55 }}>LALAPAY</div><h1 style={{ margin: '16px 0 10px' }}>{status}</h1>{transactionId && <p style={{ fontSize: 13, opacity: .55, wordBreak: 'break-all' }}>Transaction: {transactionId}</p>}</section></main>;
}
