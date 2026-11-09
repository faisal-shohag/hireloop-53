# Next.js template

## Seeker payments

Run the API on port 5000 and `npm run dev` here. `NEXT_PUBLIC_API_BASE_URL` selects the API origin (default `http://localhost:5000`). Keep `BETTER_AUTH_URL` consistent with the API's `CLIENT_URL`, and use the same hostname for both services locally.

Visit `/pricing` to buy the configured monthly Seeker Pro subscription. `/dashboard/seeker/billing` displays plan status, UTC monthly usage, and verified Checkout payments. `/payment/success` verifies the returned Stripe session; `/payment/cancel` leaves the plan unchanged. Only seekers can upgrade. Free accounts receive five applications per UTC month; active Pro accounts have unlimited applications.

The API uses its secret key and Price ID; the browser redirects to Stripe-hosted Checkout and does not need a Stripe SDK. See `../server/README.md` for configuration and test instructions.

This is a Next.js template with shadcn/ui.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
