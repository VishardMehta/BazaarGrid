# BazaarGrid — Order Management (Task 3)

Clean Architecture order-management service. JSON-file backed today,
designed to swap to MongoDB and to port to NestJS without rewrites.

## Run it

```bash
npm install
npm start          # http://localhost:3000
# or, for auto-restart on file changes:
npm run dev
```

Test UI: `http://localhost:3000/index.html`
Health check: `GET /health`

## Run the tests

```bash
# Pure unit tests (domain entities + policies, no I/O, no server)
node --test test/order-status.policy.test.js test/order.entity.test.js

# Full integration smoke test (boots the app in-process, hits every endpoint)
node test/smoke-test.js
```

The smoke test mutates `src/data/orders.json` (it creates/cancels real
orders through the API). Restore the original seed data afterward if
you want a clean slate:

```bash
git checkout src/data/orders.json   # if under git
```

## Architecture at a glance

```
HTTP Request
   ↓
routes/order.routes.js          maps verb+path → controller method
   ↓
controllers/order.controller.js parses req, calls service, shapes response
   ↓
validators/order.schema.js      Zod validates raw shape
   ↓
application/services/order.service.js   facade over use cases
   ↓
application/use-cases/*.usecase.js      orchestration: fetch → decide → persist
   ↓
domain/policies/order-status.policy.js  the ONLY place transition rules live
domain/entities/order.entity.js         the ONLY place domain invariants live
   ↓
application/repositories/order.repository.interface.js   the contract
   ↓
infrastructure/repositories/order.repository.json.js     JSON implementation
   ↓
infrastructure/repositories/json/json-file.client.js      raw fs access (ONLY file that imports `fs`)
   ↓
data/orders.json
```

Dependencies point inward only. Domain and application layers never
import Express, Zod, or `fs`.

## Why one Order model, not three

BazaarGrid has two fulfillment paths (Producer-direct, Local-Store/
reseller) and a restocking flow (store → producer). All three are
modeled as the same `Order` entity, differentiated by data:

- `sellerType`: `PRODUCER` | `LOCAL_STORE`
- `orderType`: `CUSTOMER_ORDER` | `RESTOCK_ORDER`
- `fulfillingSellerId`: whoever is actually fulfilling

No `ProducerOrder`, `StoreOrder`, or `RestockOrder` classes exist. This
means a future "all orders" report, analytics pipeline, or search index
never has to reconcile three incompatible shapes.

## Status lifecycle

```
PLACED → CONFIRMED → PACKED → FULFILLED → COMPLETED
PLACED / CONFIRMED / PACKED → CANCELLED  (cancellation, alternate path)
COMPLETED and CANCELLED are terminal — no transitions out.
```

The entire rule set lives in one transition map:
`src/modules/order/domain/policies/order-status.policy.js` →
`canTransition(current, next)`. Nothing else in the codebase hardcodes
a transition check.

Role-based gating (which actor — fulfilling seller vs. customer — may
trigger which transition) is a separate, optional layer:
`order-role.policy.js`. It's wired into `UpdateOrderStatusUseCase` via
an optional `actorRole`, but unused by today's routes since there's no
auth yet. Wiring in real auth later means passing `req.user.role`
through at the controller — zero changes to the use case or policy.

## Extension point for Quality Issues

`src/modules/order/domain/events/order-events.js` emits an
`order.completed` event whenever an order reaches `COMPLETED`. Nothing
listens today. A future `quality-issue` module subscribes here and gets
everything it needs (`orderId`, `items` with `batchId`, `completedAt`)
without any change to `order.entity.js` or any use case.

## API

| Method | Path                       | Purpose                          |
|--------|----------------------------|-----------------------------------|
| GET    | `/orders`                  | List orders (optional query filters: `sellerType`, `orderType`, `status`, `buyerId`, `fulfillingSellerId`, `channel`) |
| GET    | `/orders/:id`               | Get one order |
| POST   | `/orders`                  | Create an order |
| PATCH  | `/orders/:id/status`        | Transition status — body `{ "status": "CONFIRMED" }` |
| PATCH  | `/orders/:id/cancel`        | Cancel (alternate path of `/status`, exposed for a clean API) |

There is no `DELETE` — cancelled orders remain in the system per spec.

### Create order — example request

```json
POST /orders
{
  "orderType": "CUSTOMER_ORDER",
  "buyerId": "cust-101",
  "sellerType": "PRODUCER",
  "fulfillingSellerId": "prod-201",
  "channel": "APP",
  "fulfillmentMode": "DELIVERY",
  "items": [
    { "productId": "prd-aata-5kg", "batchId": "batch-2026-06-20", "title": "Wheat Flour 5kg", "qty": 2, "unitPrice": 220 }
  ]
}
```

`total` is server-calculated from items; you don't send it.

### Error shape

```json
{
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Cannot transition order from \"PLACED\" to \"FULFILLED\""
  }
}
```

Codes: `VALIDATION_ERROR` (400), `NOT_FOUND` (404),
`INVALID_TRANSITION` (409), `CONFLICT` (409), `INTERNAL_SERVER_ERROR` (500).

## Migrating to MongoDB

1. Write `OrderRepositoryMongo` implementing
   `application/repositories/order.repository.interface.js` (same four
   methods: `getAll`, `getById`, `create`, `update`).
2. In `src/app.js`, change one line:
   ```js
   const orderRepository = new OrderRepositoryMongo(connectionUri);
   ```
3. Done. No use case, service, controller, or route changes.

## Migrating to NestJS

- `application/use-cases/*` → become `@Injectable()` providers (or
  methods on a service).
- `application/services/order.service.js` → becomes a Nest service
  with the use cases injected via constructor DI (already
  constructor-shaped).
- `infrastructure/controllers/order.controller.js` → becomes a Nest
  `@Controller('orders')` with `@Get()`, `@Post()`, `@Patch()`
  decorators replacing the manual route wiring.
- `infrastructure/validators/order.schema.js` (Zod) → can stay as-is
  inside a Nest `ZodValidationPipe`, or be ported to `class-validator`
  DTOs — your choice, the domain layer doesn't care either way.
- `domain/` → copy-paste, unchanged. It has zero framework imports.

## Out of scope (per spec)

Payments, settlements, wallets, delivery agents — intentionally not
implemented.

---

# Task 5 — WhatsApp Order Flow

Extends the Order module above. **Does not duplicate it.** This is the
"Light WhatsApp Flow": no Business API, no Meta APIs, no OAuth, no
webhooks — just a `wa.me` deep link with a pre-filled message.

## How it integrates with Task 3

```
POST /orders/whatsapp
   ↓
whatsapp.controller.js
   ↓
whatsapp.validator.js (Zod — extends order's orderItemSchema)
   ↓
create-whatsapp-order.usecase.js
   ↓ (delegates, does not reimplement)
order/application/use-cases/create-order.usecase.js   ← same Task 3 instance
   ↓
order/domain/entities/order.entity.js                  ← same entity, same invariants
   ↓
order/infrastructure/repositories/order.repository.json.js  ← same repository, same orders.json
   ↓ (back in the WhatsApp use case)
whatsapp-message.builder.js + whatsapp-message.service.js
   ↓
{ success, message, orderId, whatsappUrl }
```

`CreateOrderUseCase` is instantiated once in `src/app.js` and handed
to `CreateWhatsappOrderUseCase` as a constructor dependency — it's the
exact same class, same logic, same repository instance as the regular
`POST /orders` endpoint uses internally. No order construction,
validation, or persistence logic is duplicated.

## What's actually new (and only this)

- Accepting and validating a `phone` field (WhatsApp-only concept).
- Defaulting `orderType: CUSTOMER_ORDER` and `channel: WHATSAPP` —
  the WhatsApp flow never asks the customer to pick these.
- Building the message text and `wa.me` URL after the order exists.

## One change to existing Task 3 code

`order/domain/entities/order-item.entity.js`: `title` is now optional
and falls back to `productId` if omitted. This was necessary because
the Task 5 spec's example request body sends only
`productId/batchId/qty/unitPrice` per item — no `title` — but the
message builder needs *some* display name per item
(`"Wild Forest Honey × 2"`). Every other item invariant (`batchId`
required, `qty > 0`, `unitPrice > 0`) is unchanged.

`src/app.js` also gained the WhatsApp wiring + an extra
`app.use('/orders', buildWhatsappRoutes(...))` mounted before the
existing order router and 404 catch-all. No existing route's
behavior, path, or response shape changed.

## API

```
POST /orders/whatsapp
{
  "buyerId": "buy_001",
  "sellerType": "PRODUCER",
  "fulfillingSellerId": "sel_001",
  "phone": "+919876543210",
  "fulfillmentMode": "DELIVERY",
  "items": [
    { "productId": "prd_001", "batchId": "bat_001", "qty": 2, "unitPrice": 450 }
  ]
}
```

```
201 Created
{
  "success": true,
  "message": "WhatsApp order created successfully",
  "orderId": "<uuid>",
  "whatsappUrl": "https://wa.me/919876543210?text=..."
}
```

Validation errors return the same `{ error: { code, message, details } }`
shape as every other endpoint (reuses the same Zod-aware error
middleware — `ValidationError` is never reimplemented).

## Message format

```
Hello 👋

I'd like to place an order.

Order ID: ORD-A1B2C3

Items
• Wild Forest Honey × 2

Total: ₹900
Fulfillment: DELIVERY

Thank you.
```

`ORD-A1B2C3` is a short, human-friendly rendering of the order's uuid
(last 6 hex characters, uppercased) — display only. Every API response
and lookup still uses the real uuid.

## Test UI

`public/whatsapp-order.html` — same plain HTML/CSS/vanilla-JS
conventions as the rest of the test UI, reuses `styles.css` unchanged.
On success it calls `window.open(whatsappUrl, '_blank')`.

## Tests

```bash
# Pure unit tests for the message builder (no http, no fs)
node --test test/whatsapp-message.builder.test.js

# Integration smoke test — boots the real app, hits POST /orders/whatsapp,
# and asserts the created order is retrievable through the EXISTING
# GET /orders/:id and obeys the EXISTING lifecycle policy (no
# WhatsApp-specific bypass of any rule).
node test/whatsapp-smoke-test.js
```

Both test files mutate `src/data/orders.json` since they go through
the real API — restore the seed data afterward if you want a clean
slate.

