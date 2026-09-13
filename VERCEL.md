# LalaPay Vercel deployment

## 1. Deploy the API first

Import `Taibur-Rahaman/lalapay-api` into Vercel.

Set:

```text
Node.js: 24.x
```

Required API environment variables:

```text
DATABASE_URL
DATABASE_SSL=true
DB_POOL_MAX=5
JWT_SECRET=<32+ random characters>
FRONTEND_URL=<frontend Vercel URL>
BKASH_BASE_URL
BKASH_APP_KEY
BKASH_APP_SECRET
BKASH_USERNAME
BKASH_PASSWORD
BKASH_CALLBACK_URL
NAGAD_BASE_URL
NAGAD_MERCHANT_ID
NAGAD_MERCHANT_NUMBER
NAGAD_MERCHANT_PRIVATE_KEY
NAGAD_PG_PUBLIC_KEY
NAGAD_CALLBACK_URL
NAGAD_CURRENCY_CODE=050
```

Initially, `FRONTEND_URL` can be updated after the frontend deployment.

Verify:

```text
https://<api-project>.vercel.app/health
```

## 2. Deploy the frontend

Import `Taibur-Rahaman/LalaPay` into Vercel.

Set:

```text
NEXT_PUBLIC_API_URL=https://<api-project>.vercel.app
NEXT_PUBLIC_APP_URL=https://<frontend-project>.vercel.app
```

Redeploy after setting environment variables.

## 3. Connect the two projects

Update the API's `FRONTEND_URL` to the exact frontend Vercel URL, then redeploy the API.

The API CORS configuration uses this value for browser requests.

## 4. Database

Use a PostgreSQL connection string in `DATABASE_URL`.

On the first database-backed API request, LalaPay creates its required tables/indexes through the current database bootstrap routine.

For production, use a managed PostgreSQL provider and a connection string intended for serverless workloads/pooling when available.

## 5. Provider configuration

### bKash

Use the merchant credentials supplied for the selected bKash environment and set the callback URL to the deployed API callback endpoint.

### Nagad

Use the merchant ID, merchant private key, Nagad gateway public key, callback URL, and any required merchant/server whitelist configuration supplied during Nagad onboarding.

Do not put these secrets in the frontend project.

## 6. Smoke test order

1. Open `/health`.
2. Register a merchant.
3. Log in.
4. Create a BDT payment link.
5. Open the hosted `/pay/<id>` page.
6. Confirm only enabled payment methods are displayed.
7. Start a sandbox/test payment with the configured provider.
8. Confirm callback/verification updates the transaction.
9. Confirm the dashboard shows the transaction and revenue.
10. Test the same `Idempotency-Key` twice and confirm it does not create a duplicate provider payment.

Never mark a transaction successful from the browser redirect alone.
