# India‑ROADS (Vercel‑ready)

An En‑ROADS‑style, India‑tailored emissions simulator (Kaya identity + forest sink + simplified carbon cycle), with interactive sliders, charts, and a **demo premium paywall** (UPI/GPay QR + optional Stripe Checkout).

## Tech stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS** (with Typography)
- **ECharts** (via `echarts-for-react`) for high‑quality interactive charts
- **Radix UI** primitives + lightweight shadcn‑style components
- **Zustand** for state

## Local development

### 1) Install dependencies

```bash
npm install
```

### 2) Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel

1. Push this repo to GitHub/GitLab.
2. In Vercel, **New Project → Import** the repo.
3. (Optional) Set environment variables (see below).
4. Deploy.

No custom `vercel.json` is required.

## Premium paywall (demo)

The app includes a premium flow to **download a premium data pack**:

- UPI / GPay QR code for **₹500** to `peeyush2212@okhdfcbank`
- Optional Stripe Checkout button
- A “demo unlock” button that flips a local flag (stored in `localStorage`)

> ⚠️ This is intentionally **not a secure paywall** yet. It’s just UI + wiring.

### Premium download file

The premium zip is served statically:

- `public/premium/india_roads_premium_data_pack.zip`

## Stripe Checkout (optional)

If you want the Stripe button to actually redirect to Checkout:

1. Create a Stripe account and get a **Secret Key**.
2. In Vercel (or your local `.env.local`), set:

```bash
STRIPE_SECRET_KEY=sk_test_...
# Optional:
STRIPE_PRICE_ID=price_...
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

If `STRIPE_PRICE_ID` is not provided, the API route creates a one‑off line item using `price_data` for **₹500**.

API route:

- `POST /api/stripe/create-checkout-session`

Redirect URLs:

- success → `/premium?paid=1`
- cancel → `/premium?canceled=1`

## Model inputs

The calibrated coefficients and baseline inputs are bundled at:

- `src/data/model_inputs.json`

A copy is also served at:

- `public/data/model_inputs.json`

## Notes / next steps

If you want to make premium gating real:

- Add a **Stripe webhook** (Vercel route) to verify payment
- Issue a signed cookie/JWT
- Gate downloads behind a server route or Edge Function

---

Built to be fast, inspectable, and easy to deploy.
