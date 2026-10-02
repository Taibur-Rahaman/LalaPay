# LalaPay Payment Flow

1. Customer opens a payment-link checkout.
2. Checkout loads the server-authoritative payment data.
3. Customer selects bKash or Nagad when available.
4. Checkout requests payment initialization from LalaPay API.
5. Provider processing happens server-side.
6. LalaPay verifies the provider result.
7. Checkout polls safe payment status until a terminal state.
8. Only a backend-confirmed `SUCCEEDED` state is shown as successful.

Refreshes reuse the existing payment identifier. The client must never create a second payment merely because the page was refreshed or polling restarted.
