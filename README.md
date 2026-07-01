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

Run the SQL files in order in the **Supabase SQL Editor**:

```
supabase/schema.sql   ← tables, enums, RLS policies, triggers
supabase/seed.sql     ← initial data (villages, sample products)
supabase/fixes.sql    ← additional policies, fixes, backfills (re-runnable)
```

`fixes.sql` is safe to re-run at any time. It adds:
- `favorites` table + RLS
- `promo_codes` table with seed codes (`BAZAAR10`, `HARVEST15`, `VILLAGE20`)
- `payment_method`, `promo_code`, `pickup_location` columns on `orders`
- Auto-create seller row when a producer is approved
- Village Admin write policy on `sellers` table
- Profile row backfill for any users missing a `profiles` row

### 4. Enable Google OAuth (optional)

In **Supabase → Auth → Providers → Google**, enable it and add your OAuth credentials. Set the redirect URL to `http://localhost:5173/auth/callback`.

### 5. Run the dev server

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

The `backend/` directory is a standalone Express API for order management with a WhatsApp order flow. It runs separately from the Vite frontend.

```bash
cd backend
npm install
npm start        # runs on http://localhost:3000
```

It currently uses a local JSON file as a datastore (`backend/src/data/orders.json`). Not yet connected to Supabase.

---

## Pending work

### High priority

- **Search on live data** — `src/features/search/hooks/useSearch.ts` still imports from `@/shared/mocks`. Needs to query `supabase.from("products")` and feed results into the existing BM25 engine (or replace with Supabase full-text search).

- **Traceability page on live data** — `src/features/catalog/pages/TraceabilityPage.tsx` reads from `@/shared/mocks`. Needs a `product_passports` table in Supabase and a query hook.

- **Real QR codes** — The product passport page shows a Material icon (`qr_code_2`), not a real scannable QR code. Needs `npm install qrcode` and encoding `https://bazaargrid.com/product/:id/passport`.

- **Backend → Supabase** — `backend/` uses a local JSON file. Should be migrated to read/write the `orders` table in Supabase.

### Lower priority

- **Semantic search** — The search engine (`src/features/search/engine.ts`) uses a hardcoded synonym table and Levenshtein fuzzy matching. There is a marked swap-point for a Python embedding service (`/api/search?q=...`) — not yet built.

- **Producer analytics** — Monthly revenue chart in `ProducerAnalyticsPage` uses hardcoded mock data. Needs aggregation query on `orders` grouped by month.

- **ProducerSettingsPage** — Form exists but save is not wired to Supabase.

- **Operator portal** — Analytics and inventory pages render static/mock data. Need real queries.

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
