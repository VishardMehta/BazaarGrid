# BazaarGrid

> Village-branded agri-commerce + local kirana network. Buyers discover and order
> packaged farm goods from **village producers** and **local kirana stores**, with
> trust and origin traceability at the core.

A team project built in **React + TypeScript**, with an **AI/ML discovery engine**
for search. Sellers come in two flavours — village producers and kirana stores —
and everything is built around that single umbrella concept.

---

## Quick start

```bash
# clone, then:
npm install
npm run dev
```

Open http://localhost:5173.

---

## The one rule that keeps our code mergeable

We are four people building five features that all touch the same objects
(Seller, Product, Order). To avoid integration hell:

1. **`src/shared/types` is the single source of truth.** Import `Seller`,
   `Product`, `Order` from there. **Never redefine them locally.**
2. **Build against mocks first** (`src/shared/mocks/`). Don't wait on anyone's
   backend — load the JSON, build your feature, swap to the real API later.
3. **Seller is the umbrella.** A seller is `VILLAGE_PRODUCER` **or**
   `KIRANA_STORE`. Branch on `seller.type` where behaviour differs.
   Never assume one type.
4. **One Order model, two channels.** App and WhatsApp orders are the *same*
   `Order`, distinguished by `channel: "APP" | "WHATSAPP"`.
5. **`DESIGN.md` is the design source of truth.** Colours, typography and spacing
   live there. Build UI to match it so every screen looks like one app.
6. **Each feature lives in `src/features/<name>/`** so our code doesn't collide.

---

## Project structure

```
bazaargrid/
├── DESIGN.md                  # design system (exported from Stitch) — read first
├── CLAUDE.md                  # rules Claude Code auto-loads each session
├── src/
│   ├── shared/
│   │   ├── types/index.ts     # Seller, Product, Order, Buyer, Search... (SSOT)
│   │   └── mocks/             # sellers, products, orders, buyers, CSV sample
│   ├── features/
│   │   ├── seller/            # Task 1 — Vishard
│   │   ├── catalog/           # Task 2 — Vishard
│   │   ├── orders/            # Task 3 — Sameer (Ashmit supports)
│   │   ├── search/            # Task 4 — Navya
│   │   └── whatsapp/          # Task 5 — Sameer (Ashmit supports)
│   ├── components/            # shared UI: Button, Card, Badge, Input...
│   ├── styles/                # design tokens
│   └── App.tsx
└── package.json
```

---

## Tasks & ownership

| Task | Feature | Owner | Support |
|------|---------|-------|---------|
| 1 | Seller Profile & Store Setup | **Vishard** | — |
| 2 | Product Catalog + CSV Upload | **Vishard** | — |
| 3 | Order Management | **Sameer** | Ashmit |
| 4 | Customer Discovery & Search (AI/ML) | **Navya** | — |
| 5 | WhatsApp Order Flow | **Sameer** | Ashmit |

**Build order:** Vishard's seller + product features are upstream — build first.
Then Navya (search) and Sameer (orders) in parallel against mocks. WhatsApp plugs
into the same order model. Integrate by swapping mocks for real endpoints, sellers
& products first.

---

## Design system (Stitch → code)

The visual design is generated in **Google Stitch** and captured in **`DESIGN.md`**
at the repo root. This is the portable design system — colours, type scale, spacing,
component patterns.

**Everyone (zero setup):** Claude Code and any agent auto-load `DESIGN.md` as
context, so generated UI stays on-brand. Just keep `DESIGN.md` updated when the
design changes.

**Optional — pull exact Stitch screens via MCP (per-developer):**
If you want Claude Code to fetch a specific Stitch screen's layout directly:

```bash
# in the repo root
npx @_davideast/stitch-mcp init     # wizard: auth + MCP config
# or the simple path: set STITCH_API_KEY env var to skip OAuth
claude mcp list                     # verify "stitch" is connected
```

This exposes `build_site`, `get_screen_code`, `get_screen_image` to Claude Code.
**Note:** Stitch outputs *static layout* only — interactivity, validation and state
are built in code. Not pixel-perfect; treat the output as a first draft.

> For a student project, `DESIGN.md` alone is enough. Only add the MCP on your own
> machine if you want screen-level pulls — don't make the whole team set up gcloud.

Brand tokens (also in `DESIGN.md`):

| Token | Value |
|-------|-------|
| Background (cream) | `#F7F3EA` |
| Primary (farm green) | `#2F5E3A` |
| Secondary (clay) | `#C06B3E` |
| Accent (turmeric) | `#E0A22B` |
| Text (dark brown) | `#3A2E25` |
| Heading font | Literata (serif) |
| Body / UI font | Work Sans (sans) |

---

## Using the shared data

```ts
import type { Seller, Product, Order } from "@/shared/types";
import sellers from "@/shared/mocks/sellers.json";
import products from "@/shared/mocks/products.json";

const liveProducts = (products as Product[]).filter(p => p.status === "LIVE");
const kiranas = (sellers as Seller[]).filter(s => s.type === "KIRANA_STORE");
```

Mock files: `sellers.json` (3 village producers + 3 kiranas), `products.json`
(10 products), `orders.json` (both channels, varied statuses), `buyers.json`,
`products_upload_sample.csv` (CSV bulk-upload format for Task 2).

---

## WhatsApp flow (Task 5) — light approach

An "Order on WhatsApp" action opens a pre-filled chat to the seller's `phone`, and
creates a real `Order` with `channel: "WHATSAPP"`. No WhatsApp Business API needed
for v1:

```
https://wa.me/<seller.phone>?text=<url-encoded order summary>
```

---

## Conventions

- **Branches:** `feat/seller-setup`, `feat/catalog`, `feat/order-mgmt`,
  `feat/search`, `feat/whatsapp-flow`. Small, frequent PRs. No direct pushes to `main`.
- **Imports:** core types only from `src/shared/types`.
- **Styling:** tokens from `DESIGN.md` / `src/styles`, shared components from
  `src/components`.
- **Integrate early and often.** Don't let branches drift.

---

## Team

Lead: **Vishard** · Coordinator: **Sameer** · Members: **Ashmit, Navya** ·
Mentors: Anil, Mayank
