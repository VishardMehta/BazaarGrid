# Stitch design references

Exact screen exports pulled from the Google Stitch project **"Remix of BazaarGrid
Traceable Rural Commerce"** (`projects/18345906975665404993`). Each screen has a
`.jpg`/`.png` screenshot and a `.html` static export (Tailwind + Newsreader/Work
Sans + Material Symbols). These are **layout references** — interactivity, state and
validation are built in code. Treat them as a first draft, not pixel-perfect law.

> Color tokens, type scale and spacing are in the repo-root [`DESIGN.md`](../../DESIGN.md).
> When the screenshot and DESIGN.md disagree, **DESIGN.md (its YAML tokens) wins**.

## Screen → feature map

| Screen | Feature / Task | Owner |
|--------|----------------|-------|
| `landing-page` | Discovery & Search (Task 4) | Navya |
| `search-results` | Discovery & Search (Task 4) | Navya |
| `village-storefront` | Seller Profile & Store Setup (Task 1) | Vishard |
| `producer-profile` | Seller Profile & Store Setup (Task 1) | Vishard |
| `producer-management-suite` | Seller Profile & Store Setup (Task 1) | Vishard |
| `village-admin-suite` | Seller Profile & Store Setup (Task 1) | Vishard |
| `product-detail` | Product Catalog + CSV (Task 2) | Vishard |
| `cart-checkout` | Order Management (Task 3) | Sameer / Ashmit |
| `my-orders` | Order Management (Task 3) | Sameer / Ashmit |
| `bulk-buyer-inquiries` | Order Management (Task 3) | Sameer / Ashmit |
| `qr-traceability-certification` | Cross-cutting (Product Passport) | shared |
| `harvest-rewards` | Cross-cutting (loyalty) | shared |
| `my-profile` | Cross-cutting (buyer account) | shared |
| `platform-partner-operations` | Cross-cutting (operator portal) | shared |
| `heritage-marketplace-flow` | Overview/flow (HTML only, no screenshot) | — |

WhatsApp order flow (Task 5) has no dedicated screen — it's a `wa.me` deep-link
action layered onto the storefront / product / checkout.
