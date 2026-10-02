# LalaPay Hosted Checkout

## Flow

Payment link -> hosted checkout -> provider selection -> LalaPay API -> provider processing -> server-side verification -> final payment status.

The browser never decides that a payment succeeded. The backend is authoritative.

## Supported providers

- bKash
- Nagad

Provider credentials and private keys must never be exposed to browser code or committed to Git.

## Checkout states

`CREATED`, `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `EXPIRED`, `CANCELLED`.

The checkout countdown is based on the server-provided `expiresAt`; it is UX only. The API must independently enforce expiration.

## Polling

The client may poll the payment status using the public payment identifier. Polling stops when the payment reaches a terminal state. Refreshing the page must reuse the existing payment identifier and must not create another payment.

## Security

Never trust a client-provided amount, provider, transaction ID, or success flag. The server must validate ownership, amount, currency, expiry and provider-confirmed status.
