'use client';

export type CheckoutPaymentStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

const labels: Record<CheckoutPaymentStatus, string> = {
  CREATED: 'Preparing payment…',
  PENDING: 'Waiting for payment',
  PROCESSING: 'Verifying payment…',
  SUCCEEDED: 'Payment successful',
  FAILED: 'Payment failed',
  EXPIRED: 'Payment expired',
  CANCELLED: 'Payment cancelled',
};

export default function PaymentStatus({ status }: { status: CheckoutPaymentStatus }) {
  const live = status === 'PENDING' || status === 'PROCESSING';
  return (
    <div role={live ? 'status' : undefined} aria-live={live ? 'polite' : undefined}>
      <p>{labels[status]}</p>
    </div>
  );
}
