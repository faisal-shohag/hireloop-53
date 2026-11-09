# HireLoop API

Run `npm ci`, then `npm run dev` (watch mode) or `npm start`. The default port is 5000.

## Seeker payments

Keep configuration in the untracked `.env`:

```dotenv
MONGO_DB_URI=your-mongodb-connection-string
STRIPE_SECRET_KEY=your-stripe-secret-key
PRODUCT_ID=your-monthly-stripe-price-id
CLIENT_URL=http://localhost:3000
```

`PRODUCT_ID` must be an active, fixed monthly recurring Stripe **Price ID** (`price_…`). The client displays Stripe's configured amount and currency. `CLIENT_URL` defaults to `http://localhost:3000`; set it to the Next.js origin for deployments. Client and server must connect to the same BetterAuth database (`hireloopdb`). Serve both under the same site so the browser can send session cookies; use HTTPS in production.

Stripe Checkout handles card collection. The server validates sessions through BetterAuth on the configured client origin; no secret or client-supplied identity controls pricing or eligibility. Hosted checkout does not require the existing publishable key.

The Stripe API contract is pinned to `2026-10-28.endive`. Checkout uses `allowed_payment_method_types: ['card']` to filter the payment methods enabled in your Stripe Dashboard. Keep card payments enabled there. Keep the version pin when upgrading the SDK, and validate API changes before changing it.

Payment verification occurs when the seeker returns to `/payment/success`. Visiting or refreshing the URL only upgrades the authenticated owner after Stripe confirms payment. Billing history records verified initial Checkout payments, not renewal invoices. Webhooks are not implemented: a successful payment needs a return visit to be saved. Returning to pricing and retrying an already completed pending checkout also verifies it before creating another subscription.

Free seekers receive five applications per UTC calendar month, including archived applications. Active paid subscribers receive unlimited applications. Billing and application submissions refresh subscription eligibility from Stripe, so canceled/unpaid plans do not retain unlimited access. Scheduled cancellation keeps access until the paid period ends. A transient Stripe failure returns a retryable error without changing saved plan data.

MongoDB must support transactions (replica set or sharded cluster). Startup creates a unique transaction `sessionId` index and an application `{ userId, appliedAt }` index. Missing user plan fields mean Free; existing ISO-string and BSON-date application timestamps both count.

## Tests

`npm test` runs Node's test runner. Unit tests cover auth and price validation. Database integration tests use a randomly named `hireloop_payment_test_*` database on `TEST_MONGO_DB_URI` or `MONGO_DB_URI`, and remove only that test database afterward. Without either URI, database tests are explicitly skipped. Use a transaction-capable test MongoDB instance.

For manual Stripe testing, use test-mode keys and card `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline), or `4000 0025 0000 3155` (3D Secure), with a future expiry and any CVC.
