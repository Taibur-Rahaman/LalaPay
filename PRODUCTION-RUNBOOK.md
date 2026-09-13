# LalaPay Frontend Production Runbook

## Vercel environment

Set:

- `NEXT_PUBLIC_APP_URL` = the exact deployed LalaPay frontend URL
- `NEXT_PUBLIC_API_URL` = the exact deployed `lalapay-api` Vercel URL

Do not put API secrets in `NEXT_PUBLIC_*` variables.

## Merchant flow

1. Open the frontend URL.
2. Register a merchant account.
3. Sign in.
4. Create a payment link.
5. Select bKash, Nagad, or both.
6. Optionally set an expiry time.
7. Copy the hosted `/pay/<public-id>` URL.
8. Open the URL in a separate browser/session.
9. Start a sandbox payment.
10. Complete or cancel the provider flow.
11. Confirm the success page polls the API and reaches the final state.
12. Return to the dashboard and verify the transaction.

## Production checks

- Frontend and API must use HTTPS.
- `NEXT_PUBLIC_API_URL` must not end with a stale deployment URL.
- API CORS `FRONTEND_URL` must exactly match the frontend URL.
- Payment links must not expose merchant customer PII on the public page.
- Use the dashboard Refresh action after provider callbacks if a transaction is still pending.
- Never commit `.env.local` or provider credentials.
