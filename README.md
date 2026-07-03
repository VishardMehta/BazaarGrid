# BazaarGrid

Village-branded agri-commerce platform. Buyers discover and order packaged farm goods from village producers and kirana stores, with origin traceability at the core.

**Stack:** React + TypeScript + Vite · Supabase (auth + DB) · React Query · Framer Motion · Tailwind CSS

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local` in the repo root (never commit this file):

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Get these from **Supabase → Project Settings → API**.

### 3. Set up the database

Run the SQL files **in this order** in the **Supabase SQL Editor**:

```
supabase/schema.sql                  ← tables, enums, RLS policies, triggers
supabase/seed.sql                    ← initial data (villages, sample products)
supabase/fixes.sql                   ← favorites, promo codes, approval RPCs, backfills
supabase/location_and_collectives.sql ← state/district columns, FPO/SHG seller types
supabase/payments.sql                ← Razorpay payment tracking columns
```

All files are safe to re-run. Each is scoped to one topic rather than one giant file, so re-running after a pull only costs you the new file, not the whole history.

### 4. Configure Razorpay (optional — needed for real checkout)

Card/UPI/netbanking checkout uses Razorpay; Cash on Delivery works without it.

1. Get keys from **Razorpay Dashboard → Settings → API Keys**.
2. Add to `.env.local`: `VITE_RAZORPAY_KEY_ID=<your key id>` (public, safe client-side).
3. Copy `backend/.env.example` to `backend/.env` and fill in `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` (server-side only — never put the secret in `.env.local`).
4. Run the backend (`cd backend && npm install && npm start`) alongside the frontend — Vite proxies `/api/*` to it in dev.

Without this, checkout still works end-to-end via **Cash on Delivery**.

### 5. Enable Google OAuth (optional)

In **Supabase → Auth → Providers → Google**, enable it and add your OAuth credentials. Set the redirect URL to `http://localhost:5173/auth/callback`.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Roles

| Role | Description |
|------|-------------|
| `BUYER` | Default on signup. Browses shop, places orders, saves favorites. |
| `PRODUCER` | Starts as `PENDING`, approved by Village Admin. Manages products and orders via Producer Portal. |
| `VILLAGE_ADMIN` | Manages producers, storefront, and village campaigns. |
| `OPERATOR` | Platform-wide admin. Sees all analytics, inventory, villages. |

Role is set during onboarding. Producers require manual approval in the Village Admin portal.

---

## Project structure

```
src/
├── features/
│   ├── auth/          # Login, signup, onboarding, protected routes
│   ├── catalog/       # Shop, product detail, traceability passport
│   ├── cart/          # Cart context + checkout
│   ├── orders/        # Cart page, my orders
│   ├── search/        # Search results, BM25 engine
│   ├── seller/        # Producer portal, Village Admin portal
│   ├── operator/      # Operator portal
│   ├── account/       # Profile, favorites, rewards
│   └── whatsapp/      # WhatsApp order flow
├── components/        # Shared UI (Button, Card, Badge, Icon, etc.)
├── lib/
│   ├── hooks/         # React Query hooks (useProducts, useOrders, etc.)
│   ├── supabase.ts    # Supabase client + types
│   ├── mappers.ts     # DB row → frontend type
│   └── format.ts      # formatPrice (INR default)
├── shared/
│   ├── types/         # All shared TypeScript types
│   └── mocks/         # Static JSON used by search + legacy code
backend/               # Node.js order management REST API (standalone)
supabase/              # SQL migrations
```

---

## Backend (Node.js API)

The `backend/` directory is a standalone Express API hosting the **Razorpay payment module** and the **WhatsApp structured-commerce bot**. It runs separately from the Vite frontend; Vite proxies `/api/*` to it in dev.

```bash
cd backend
npm install
cp .env.example .env   # fill in Supabase service-role + (optional) Razorpay/WhatsApp
npm start              # http://localhost:3000
npm test               # 27 tests incl. the WhatsApp conversation flow
```

### WhatsApp bot (structured ordering, no NLP — roadmap V1)

Buyers order entirely inside WhatsApp: **pick store → browse catalogue → quantity → confirm → payment link**. The order lands in the **same Supabase `orders` table** (`channel: 'WHATSAPP'`), so producers see it in the same dashboard as app/web orders.

- **Live now, no Meta account needed:** the whole flow runs in **dry-run** and is testable via a simulator. With the backend running:
  ```bash
  curl -sX POST localhost:3000/orders/whatsapp/simulate \
    -H 'content-type: application/json' -d '{"from":"919876543210","text":"hi"}'
  # returns the outbound messages; keep POSTing with interactiveId (e.g. "store:<id>")
  ```
  (Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` so it can read the live catalogue and write orders.)
- **To go live:** set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` from a Meta WhatsApp Business API account, and point the Meta webhook at `https://<your-public-host>/orders/whatsapp/webhook`. The same engine that the simulator drives then talks to real WhatsApp — no code change.

> The old one-shot `wa.me` deep link (`POST /orders/whatsapp`) still exists for the frontend's "Order on WhatsApp" button; the bot above is the new full conversational flow.

The legacy JSON-backed order endpoints (`backend/src/data/orders.json`) are unused by the live app (Supabase is the datastore) — safe to ignore.

---

## Pending work

### High priority

- **Razorpay needs live keys to actually charge anyone.** The integration (backend order creation, signature verification, frontend Checkout) is fully built — see "Configure Razorpay" above. Until keys are added, only Cash on Delivery completes checkout.

- **WhatsApp bot needs a Meta account + public webhook to go live.** The full structured-ordering engine is built and tested (dry-run + simulator work now); it just needs WhatsApp Business API credentials and a deployed HTTPS webhook URL — see the Backend section.

- **Real QR codes** — The product passport page shows styled heritage content, not an actual scannable QR. Needs `npm install qrcode` to generate one encoding `/trace/:batchId` (that route already exists and resolves batch → product).

### Lower priority

- **Semantic search** — The search engine (`src/features/search/engine.ts`) uses a hardcoded synonym table and Levenshtein fuzzy matching, not embeddings. Comment marks the swap point for a future embedding service.

- **ProducerSettingsPage** — Form exists but save is not wired to Supabase.

- **Operator portal** — Analytics and inventory pages render static/mock data. Need real queries.

- **Backend order storage** — `backend/` (the standalone Express API used only for the payment module) still has an unrelated legacy JSON-backed order flow (`backend/src/data/orders.json`) from before the app moved to Supabase. It isn't used by the live checkout path (`src/lib/api/orders.ts` is dead code) — safe to ignore or remove.

### Done

- ✅ **Traceability / Product Passport page** — live Supabase data: product, seller, village, "Meet the Producer" deck, journey timeline, heritage story card.
- ✅ **Search** — migrated off mock data; products/sellers/village filters all query Supabase live.
- ✅ **Location** — State → District picker (bundled India dataset), buyer's shopping location shown on Shop/Villages pages, "near you" sorting.
- ✅ **FPO / SHG seller types** — modeled as `sellers.type` values (same architecture as any producer), selectable at onboarding.
- ✅ **Payments** — Razorpay Checkout wired end-to-end (needs your keys to go live); COD works with zero config.
- ✅ **Invoices** — printable per-order invoice at `/orders/:id/invoice`.
- ✅ **WhatsApp structured ordering** — full conversational bot (store → catalogue → quantity → confirm → payment link), orders into the same Supabase tables; dry-run + simulator work now, plug in Meta creds to go live.
- ✅ **Harvest Tokens, reviews/ratings, live stock, real analytics, working CSV bulk import** — see prior commits.

---

## Design system

Brand tokens:

| Token | Value |
|-------|-------|
| Background (cream) | `#F7F3EA` |
| Primary (farm green) | `#2F5E3A` |
| Secondary (clay) | `#C06B3E` |
| Accent (turmeric) | `#E0A22B` |
| Text (dark brown) | `#3A2E25` |
| Heading font | Literata (serif) |
| Body / UI font | Work Sans (sans) |

Design tokens live in `src/styles/`. Component library is in `src/components/ui/` and `src/components/shared/`.
