'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

type PaymentStatus = 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED';

function PaymentSuccessContent() {
  const params = useSearchParams();
  const transactionId = params.get('transaction');
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [message, setMessage] = useState('Checking payment status…');

  useEffect(() => {
    if (!transactionId || !API_URL) {
      setMessage('Payment status is unavailable.');
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const maxAttempts = 12;

    const check = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/payments/${encodeURIComponent(transactionId)}`, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.success) throw new Error('Unable to check payment status.');

        const next = body.data?.status as PaymentStatus;
        if (!cancelled) {
          setStatus(next);
          if (next === 'SUCCESS') setMessage('Payment successful');
          else if (next === 'FAILED') setMessage('Payment failed');
          else setMessage('Payment is being processed');
        }

        attempts += 1;
        if (!cancelled && next !== 'SUCCESS' && next !== 'FAILED' && attempts < maxAttempts) {
          timer = setTimeout(check, 2500);
        }
      } catch {
        if (!cancelled) setMessage('Payment status is temporarily unavailable.');
      }
    };

    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [transactionId]);

  const success = status === 'SUCCESS';
  const failed = status === 'FAILED';

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f6f7f9', fontFamily: 'system-ui' }}>
      <section style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.08)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', opacity: .55 }}>LALAPAY</div>
        <div aria-live="polite">
          <h1 style={{ margin: '16px 0 10px' }}>{message}</h1>
          {!success && !failed && <p style={{ margin: 0, opacity: .65 }}>Please keep this page open while the payment provider confirms the transaction.</p>}
        </div>
        {transactionId && <p style={{ marginTop: 18, fontSize: 13, opacity: .55, wordBreak: 'break-all' }}>Transaction: {transactionId}</p>}
      </section>
    </main>
  );
}

function LoadingPaymentStatus() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f6f7f9', fontFamily: 'system-ui' }}>
      <section style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 20, padding: 32, textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.08)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.08em', opacity: .55 }}>LALAPAY</div>
        <h1 style={{ margin: '16px 0 10px' }}>Checking payment status…</h1>
        <p style={{ margin: 0, opacity: .65 }}>Please wait.</p>
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingPaymentStatus />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
