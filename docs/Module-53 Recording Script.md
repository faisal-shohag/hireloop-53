# Module-53 Recording Script

**Module Outline:**

## Module 53: Payment Integration with Stripe

- 53-1 Overview of the pricing strategy for recruiters and job seekers
- 53-2 Creating a Stripe account and setting up the checkout session
- 53-3 Setting up Stripe subscription plans (Pro plan)
- 53-4 Completing transactions for recruiter and job seeker plans
- 53-5 Handling success and cancel pages
- 53-6 Saving & updating plan information in the database
- 53-7 Admin dashboard: user management and the BetterAuth Admin plugin
- 53-8 Admin job approval flow, and transaction management

## Code

Server: (link যোগ করুন)

Client: (link যোগ করুন)

Live Link: (link যোগ করুন)

## Docs

- Stripe Checkout Quickstart (Next.js): https://docs.stripe.com/checkout/quickstart?client=next&locale=en-GB
- Stripe Subscriptions: https://docs.stripe.com/billing/subscriptions/build-subscriptions
- Stripe Products & Prices: https://docs.stripe.com/products-prices/overview
- Stripe Test Cards: https://docs.stripe.com/testing
- Stripe Webhooks: https://docs.stripe.com/webhooks
- BetterAuth Admin Plugin: https://www.better-auth.com/docs/plugins/admin
- MongoDB Unique Index: https://www.mongodb.com/docs/manual/core/index-unique/
- MongoDB Aggregation $group: https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/
- shadcn/ui Table: https://ui.shadcn.com/docs/components/base/table
- shadcn/ui Badge: https://ui.shadcn.com/docs/components/base/badge
- shadcn/ui Dropdown Menu: https://ui.shadcn.com/docs/components/base/dropdown-menu

---

## 53-1 Overview of the pricing strategy for recruiters and job seekers

- এই ভিডিওতে আগে দেখে নিব Module 52 পর্যন্ত আমরা কী বানিয়েছি, তারপর Hireloop কীভাবে income করবে সেটা বুঝব। Figma ওপেন করে Pricing Page টা দেখাবেন।
- Module 52 recap (সংক্ষেপে): Browse Jobs, Job Details, Apply, My Applications, Recruiter এর Applications ও status update।
- **কেন payment দরকার?** একটা real platform এ free আর paid feature আলাদা থাকে। Free user limit এর মধ্যে ব্যবহার করবে, বেশি দরকার হলে Pro plan নিবে।

**Pricing strategy (উদাহরণ, আপনার প্রজেক্ট অনুযায়ী বদলে নিতে পারেন):**

| Role | Free Plan | Pro Plan |
| --- | --- | --- |
| Recruiter | সর্বোচ্চ ৩টা active job post | Unlimited job post, featured job badge |
| Job Seeker | মাসে সর্বোচ্চ ৫টা application | Unlimited application, profile highlight |

- বোঝাবেন: দুই role এর জন্য আলাদা plan, তাই Stripe এ দুইটা আলাদা Price তৈরি হবে (Recruiter Pro, Seeker Pro)।
- Seeker এর জন্য Payment imlement করে Recruiter এ payment impelment করার জন্য Task দিয়ে দিবেন Student দের।&#32;
- Admin এর জন্য কোনো plan নেই, admin শুধু সবকিছু manage করবে।

**পুরো payment workflow এঁকে দেখাবেন:**

**User: Pricing Page → Upgrade বাটন → Server এ Checkout Session তৈরি → Stripe Hosted Checkout → Payment → Success / Cancel Page → DB তে plan update + transaction save**

**Admin: Users manage → Job approve/reject → Transactions দেখা**

- Stripe কীভাবে কাজ করে সংক্ষেপে বলবেন: card এর তথ্য কখনো আমাদের server এ আসে না, Stripe নিজে handle করে। এটাই সবচেয়ে নিরাপদ পদ্ধতি।

## 53-2 Creating a Stripe account and setting up the checkout session

- https://stripe.com এ গিয়ে account তৈরি করে দেখাবেন। **Test mode** অন রাখবেন ।
- Dashboard থেকে **Developers → API keys** এ গিয়ে Publishable key ও Secret key দেখাবেন।
- বোঝাবেন: Secret key কখনো client এ বা GitHub এ যাবে না, শুধু server এর `.env` এ থাকবে।

Server এ Stripe package install করবেন:(Next js এর server use করেও দেখাতে পারেন  <https://docs.stripe.com/checkout/quickstart?client=next&locale=en-GB> - প্রসেস প্রায় Similar)

```bash
npm install stripe
```

`.env` ফাইলে যোগ করবেন:

```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
CLIENT_URL=http://localhost:3000
```

- Checkout Session কী? ব্যাখ্যা করবেন: user কে Stripe এর hosted payment page এ পাঠানোর জন্য server এ একটা session তৈরি হয়, Stripe আমাদের একটা URL দেয়, client সেই URL এ redirect করে।

প্রথমে একটা simple one-time payment দিয়ে checkout session বুঝাবেন:

```ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

app.post("/create-checkout-session", async (req: Request, res: Response) => {
  const { email, userId } = req.body;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Hireloop Test Product" },
          unit_amount: 1000,
        },
        quantity: 1,
      },
    ],
    metadata: { userId },
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
  });

  res.status(200).json({ url: session.url });
});
```

- প্রতিটা field কী কাজ করে বুঝাবেন: `mode`, `line_items`, `customer_email`, `metadata`, `success_url`, `cancel_url`।
- `unit_amount` cent এ দিতে হয় (1000 = $10), এটা বিশেষভাবে বলবেন।
- `{CHECKOUT_SESSION_ID}` একটা Stripe placeholder, Stripe নিজে আসল ID বসিয়ে দেয়।
- `metadata` কেন দরকার: payment শেষে কে payment করেছে সেটা চিনতে।

Client এ একটা বাটন তৈরি করে fetch করে দেখাবেন:

```tsx
const handleCheckout = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/create-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, userId: user.id }),
  });
  const data = await res.json();
  window.location.href = data.url;
};
```

- বাটনে ক্লিক করে Stripe এর checkout page এ যাওয়া দেখাবেন। Test card `4242 4242 4242 4242` (যেকোনো future expiry ও CVC) ব্যবহার করে payment করে দেখাবেন।

## 53-3 Setting up Stripe subscription plans (Pro plan)

- এবার one-time payment থেকে **subscription** এ যাবেন। বুঝাবেন: Pro plan প্রতি মাসে auto renew হবে।
- Stripe Dashboard → **Product catalog → Add product** থেকে দুইটা product তৈরি করবেন:
  - **Hireloop Recruiter Pro** (Recurring, Monthly)
  - **Hireloop Seeker Pro** (Recurring, Monthly)
- প্রতিটা product এর Price ID কপি করবেন (`price_xxxxx`)। বুঝাবেন Product আর Price এর পার্থক্য।
- Price ID গুলো `.env` এ রাখবেন:

```
STRIPE_RECRUITER_PRO_PRICE_ID=price_xxxxxxxx
STRIPE_SEEKER_PRO_PRICE_ID=price_yyyyyyyy
```

Plans এর config একটা আলাদা ফাইলে রাখবেন (`src/config/plans.ts`):

```ts
export const PLANS = {
  recruiter: {
    pro: {
      name: "Recruiter Pro",
      priceId: process.env.STRIPE_RECRUITER_PRO_PRICE_ID as string,
    },
  },
  seeker: {
    pro: {
      name: "Seeker Pro",
      priceId: process.env.STRIPE_SEEKER_PRO_PRICE_ID as string,
    },
  },
} as const;
```

Checkout session কে subscription mode এ আপডেট করবেন। **Price ID client থেকে নিবেন না**, server নিজে role দেখে ঠিক করবে (নিরাপত্তার জন্য):

```ts
app.post("/create-checkout-session", async (req: Request, res: Response) => {
  const { userId, email, role } = req.body;

  if (role !== "recruiter" && role !== "seeker") {
    res.status(400).json({ message: "This role cannot buy a plan" });
    return;
  }

  const plan = PLANS[role].pro;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    metadata: { userId, role, planName: plan.name },
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
  });

  res.status(200).json({ url: session.url });
});
```

- Pricing Page এ দুই role এর জন্য Free ও Pro card দেখাবেন (AI দিয়ে Figma screenshot reference দিয়ে generate করে নিবেন)।
- Current plan Pro হলে বাটন disabled বা "Current Plan" দেখাবে, এটা পরের ভিডিওতে DB থেকে আনা হবে।

## 53-4 Completing transactions for recruiter and job seeker plans

- এই ভিডিওতে দুই role দিয়েই পুরো payment complete করে দেখাবেন।
- **Recruiter দিয়ে:** Login → Pricing Page → Upgrade to Pro → Stripe Checkout → Test card দিয়ে payment।
- **Seeker দিয়ে:** আলাদা account এ login করে একই flow দেখাবেন, এবার Seeker Pro এর price আসছে সেটা দেখাবেন।
- Stripe Dashboard এর **Payments** ও **Subscriptions** সেকশনে গিয়ে payment আসছে কিনা দেখাবেন।
- Useful test card গুলো দেখাবেন: (<https://docs.stripe.com/testing>)
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
  - 3D Secure: `4000 0025 0000 3155`
- Client এর Upgrade বাটনের logic:

```tsx
const handleUpgrade = async () => {
  setLoading(true);
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, email: user.email, role: user.role }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  } finally {
    setLoading(false);
  }
};
```

- লগইন না করা user Upgrade চাপলে login page এ পাঠাতে হবে, এটাও handle করে দেখাবেন।

## 53-5 Handling success and cancel pages

- Payment শেষে Stripe user কে আমাদের দেওয়া `success_url` বা `cancel_url` এ ফেরত পাঠায়।
- `/payment/success` ও `/payment/cancel` নামে দুইটা page তৈরি করবেন (AI দিয়ে design করিয়ে নিবেন)।

**Success page:**

- URL এ আসা `session_id` query parameter টা `searchParams` থেকে নিবেন (Module 52 এ শেখা searchParams মনে করিয়ে দিবেন)।
- এই session\_id server এ পাঠিয়ে verify করবেন যে payment সত্যিই হয়েছে। **শুধু success page এ আসা মানেই payment হয়েছে, এমন ধরে নেওয়া যাবে না।**

```tsx
const SuccessPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) => {
  const { session_id } = await searchParams;

  if (!session_id) return <p>Invalid session.</p>;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/payments/verify?session_id=${session_id}`,
    { cache: "no-store" }
  );
  const data = await res.json();

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-semibold">Payment successful</h1>
      <p className="mt-2">You are now on the {data.planName} plan.</p>
    </div>
  );
};

export default SuccessPage;
```

**Cancel page:**

- "Payment cancelled" মেসেজ, "Try again" বাটন (Pricing Page এ ফেরত) ও "Back to dashboard" লিংক।
- বুঝাবেন: cancel করলে কোনো টাকা কাটে না এবং DB তে কিছু পরিবর্তন হয় না।

## 53-6 Saving & updating plan information in the database

- এই ভিডিওতে payment verify করে DB তে plan ও transaction সংরক্ষণ করবেন।

**User collection এ plan এর তথ্য add ****হবে:**

```ts
interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: "seeker" | "recruiter" | "admin";
  avatar?: string;
  plan: "free" | "pro";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planStartedAt?: Date;
}
```

**Transactions collection (নতুন):**

```ts
interface Transaction {
  _id?: string;
  userId: string;
  email: string;
  role: "seeker" | "recruiter";
  planName: string;
  amount: number;
  currency: string;
  sessionId: string;
  paymentStatus: string;
  createdAt: Date;
}
```

- `transactionsCollection` তৈরি করবেন এবং `sessionId` এর উপর **unique index** দিবেন, যাতে একই payment দুইবার save না হয় (page refresh করলে duplicate হওয়া আটকাবে)। Unique index এর docs দেখিয়ে দিবেন।

```ts
await transactionsCollection.createIndex({ sessionId: 1 }, { unique: true });
```

Payment verify করার API:

```ts
app.get("/payments/verify", async (req: Request, res: Response) => {
  const sessionId = req.query.session_id;

  if (typeof sessionId !== "string") {
    res.status(400).json({ message: "session_id is required" });
    return;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    res.status(400).json({ message: "Payment not completed" });
    return;
  }

  const { userId, role, planName } = session.metadata as {
    userId: string;
    role: "seeker" | "recruiter";
    planName: string;
  };

  // 1. user এর plan update
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        plan: "pro",
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        planStartedAt: new Date(),
      },
    }
  );

  // 2. transaction save (duplicate হলে ignore)
  try {
    await transactionsCollection.insertOne({
      userId,
      email: session.customer_details?.email ?? "",
      role,
      planName,
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency ?? "usd",
      sessionId,
      paymentStatus: session.payment_status,
      createdAt: new Date(),
    });
  } catch (err: any) {
    if (err.code !== 11000) throw err;
  }

  res.status(200).json({ message: "Plan updated", planName });
});
```

- `11000` হলো MongoDB এর duplicate key error code, এটা কেন ignore করছি ব্যাখ্যা করবেন।
- `amount_total / 100` কেন করছি: Stripe cent এ amount দেয়।

**Plan limit enforce করা (উদাহরণ):**

- Recruiter free plan এ ৩টার বেশি job post করতে চাইলে `POST /jobs` এ আটকাবেন:

```ts
if (recruiter.plan === "free") {
  const count = await jobsCollection.countDocuments({ recruiterId });
  if (count >= 3) {
    res.status(403).json({ message: "Free plan limit reached. Upgrade to Pro." });
    return;
  }
}
```

- Dashboard এ current plan badge দেখাবেন (Free / Pro)।
- **Bonus (optional):** Stripe Webhook (`checkout.session.completed`) এর কথা বলবেন। Production এ webhook ব্যবহার করা বেশি নির্ভরযোগ্য, কারণ user success page এ না এলেও Stripe নিজে server কে জানিয়ে দেয়। এই module এ আমরা verify পদ্ধতি দিয়ে শিখছি, webhook এর docs লিংক দিয়ে দিবেন।

## 53-7 Admin dashboard: user management and the BetterAuth Admin plugin

- doc: <https://better-auth.com/docs/plugins/admin>
- Admin এর কাজ: সব user দেখা, role পরিবর্তন করা, ban/unban করা, user delete করা।
- BetterAuth এর **Admin plugin** এই কাজগুলো সহজ করে দেয়, তাই নিজে API বানাতে হবে না।

Better Auth config এ plugin যোগ করবেন:&#32;

```ts
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  // ...আগের config
  plugins: [
    admin({
      defaultRole: "seeker",
      adminRoles: ["admin"],
    }),
  ],
});
```

auth client এ:

```typescript
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [adminClient()],
});
```

- একটা user কে manually DB থেকে `role: "admin"` করে admin বানাবেন, কারণ প্রথম admin কে নিজে সেট করতে হয়।

**Admin Users page (`/dashboard/admin/users`):**

- Sidebar এ "Users" লিংক যোগ করবেন (Module 51 এর role-wise sidebar এ):

```ts
admin: [
  {
    label: "Admin Role",
    items: [
      { title: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      { title: "Users", href: "/dashboard/admin/users", icon: Users },
      { title: "Jobs", href: "/dashboard/admin/jobs", icon: Briefcase },
      { title: "Transactions", href: "/dashboard/admin/transactions", icon: CreditCard },
    ],
  },
],
```

- shadcn/ui Table দিয়ে সব user এর list দেখাবেন:

```tsx
const { data, error } = await authClient.admin.listUsers({
  query: { limit: 10, offset: 0, sortBy: "createdAt", sortDirection: "desc" },
});
```

- Table এর কলাম: Name, Email, Role, Plan, Status (Active/Banned), Actions।
- Action গুলো (Dropdown Menu দিয়ে):

```tsx
// role পরিবর্তন
await authClient.admin.setRole({ userId, role: "recruiter" });

// ban / unban
await authClient.admin.banUser({ userId, banReason: "Spam" });
await authClient.admin.unbanUser({ userId });

// delete
await authClient.admin.removeUser({ userId });
```

- Delete এর আগে confirm Dialog দেখাবেন (Module 51 এর delete এর মতো)।
- বুঝাবেন: এই সব action শুধু admin role এর user করতে পারবে, Better Auth নিজেই permission check করে।
- Role wise route protect: admin না হলে `/dashboard/admin/*` এ ঢুকতে পারবে না।

## 53-8 Admin job approval flow, and transaction management

**Job approval flow:**

- এখন পর্যন্ত recruiter job post করলেই সেটা সবাই দেখতে পায়। Real platform এ spam আটকাতে admin approve করার পর job public হয়।
- Flow: **Recruiter job post করে (status: pending) → Admin এর Jobs page এ দেখায় → Approve / Reject → Approved হলে Browse Jobs এ দেখা যায়**

Job interface এ `status` ফিল্ড যোগ করবেন:

```ts
interface Job {
  // ...আগের ফিল্ডগুলো
  recruiterId: string;
  status: "pending" | "approved" | "rejected";
}
```

- `POST /jobs` এ নতুন job এর `status` ডিফল্ট `"pending"` সেট করবেন (client এর পাঠানো value এর উপর ভরসা না করে server এ সেট হবে)।
- Browse Jobs API তে শুধু approved job আনবেন:

```ts
const filter: any = { status: "approved" };
// ...search ও filter এর শর্ত এখানে যোগ হবে
const jobs = await jobsCollection.find(filter).toArray();
```

- Admin এর জন্য সব job আনার API ও approval API:

```ts
app.get("/admin/jobs", async (req: Request, res: Response) => {
  const jobs = await jobsCollection.find().sort({ _id: -1 }).toArray();
  res.status(200).json(jobs);
});

app.patch("/admin/jobs/:id/status", async (req: Request, res: Response) => {
  const jobId = req.params.id;
  const { status } = req.body;

  if (typeof jobId !== "string" || !ObjectId.isValid(jobId)) {
    res.status(400).json({ message: "Invalid job ID" });
    return;
  }
  if (!["approved", "rejected", "pending"].includes(status)) {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  const result = await jobsCollection.updateOne(
    { _id: new ObjectId(jobId) },
    { $set: { status } }
  );
  res.status(200).json({ message: "Job status updated", modifiedCount: result.modifiedCount });
});
```

- **গুরুত্বপূর্ণ:** এই admin API গুলো শুধু admin এর জন্য। Session থেকে role যাচাই করে তারপর কাজ করতে হবে (Module 52 এর role যাচাই এর মতো)।
- Admin Jobs page: shadcn Table এ job এর list, status Badge (Pending , Approved , Rejected), Approve ও Reject বাটন।
- Recruiter এর Manage Jobs table এও status Badge দেখাবেন, যাতে সে জানে job approved হয়েছে কিনা।

**Transaction management:**

- সব payment এর list দেখানোর API:

```ts
app.get("/admin/transactions", async (req: Request, res: Response) => {
  const transactions = await transactionsCollection
    .find()
    .sort({ createdAt: -1 })
    .toArray();
  res.status(200).json(transactions);
});
```

- Admin Transactions page এ Table: User email, Role, Plan, Amount, Date, Status।
- **Total revenue** দেখানোর জন্য MongoDB Aggregation `$group` ব্যবহার করবেন (docs লিংক(<https://www.mongodb.com/docs/manual/reference/operator/aggregation/group/>) দেখিয়ে দিবেন):

```ts
app.get("/admin/revenue", async (req: Request, res: Response) => {
  const result = await transactionsCollection
    .aggregate([
      {
        $group: {
          _id: "$role",
          totalRevenue: { $sum: "$amount" },
          totalPayments: { $sum: 1 },
        },
      },
    ])
    .toArray();
  res.status(200).json(result);
});
```

- Module 51 এ বানানো `DashboardStats` component ব্যবহার করে Admin Dashboard এ stats card দেখাবেন: Total Users, Total Jobs, Pending Jobs, Total Revenue।

**Module summary:**

- এই module এ আমরা শিখলাম: Pricing strategy, Stripe account ও Checkout Session, Subscription plan, Success/Cancel page, payment verify করে DB তে plan ও transaction সংরক্ষণ, BetterAuth Admin plugin দিয়ে user management, Admin job approval ও transaction/revenue management।
- **Homework দিবেন:** Recruiter এর জন্য  একইভাবে subscription based payment implement করা।
