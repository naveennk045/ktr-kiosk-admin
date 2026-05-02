# KTR Kiosk Server HTTP API

FastAPI service (default port `8080` via Uvicorn). Interactive schemas:

- `GET /docs` (Swagger UI)
- `GET /redoc` (ReDoc)

## Conventions

- Content type: `application/json` unless otherwise noted.
- CORS: currently `allow_origins=["*"]` (tighten in production).
- Request tracing: all HTTP responses include `X-Request-Id`.
  - Frontend should send `X-Request-Id` to correlate actions with logs.
- Store scoping:
  - Most kiosk and dashboard routes require header `X-Store-Id`.
  - Value can be numeric `stores.id` or case-insensitive `store_code`.
  - Missing `X-Store-Id` where required -> `400`.
  - Unknown/inactive store -> `404`.
- No store header required for:
  - `GET /admin/kiosk-config`
  - `GET /admin/logs`
  - `GET /admin/logs/stream`
  - `/payments/*` routes (store is resolved from `orders.store_id`).

## Root

- `GET /` -> basic health/welcome payload.

## Catalog (`/catalog`)

Requires `X-Store-Id`.

- `GET /catalog/?channel=...` -> processed catalog (cache -> DB -> live fallback).
- `DELETE /catalog/cache?channel=...` -> clears Redis key for store/channel.
- `GET /catalog/cache-stats` -> cached channel suffixes for selected store.

## Orders

Requires `X-Store-Id`.

- `POST /orders/` -> create order (`OrderCreateRequest`).
- `GET /orders/` -> dashboard list (`page`, `size`, `sortBy`, `sortDir`, `period`, `status`, `search`).
- `GET /orders/{order_id}` -> dashboard detail.

## Analytics (`/analytics`)

Requires `X-Store-Id`.

- `GET /analytics/summary?period=all_time|today|yesterday|last_week`
  - KPI summary based on completed orders only (IST windows).

## Payments (`/payments`)

No `X-Store-Id` header usage.

- Dynamic QR (PhonePe):
  - `POST /payments/qr/init`
  - `GET /payments/qr/status/{order_id}`
- EDC (Pine Labs):
  - `POST /payments/edc/init`
  - `GET /payments/edc/status/{order_id}`
- Cash:
  - `POST /payments/cash/init` (staff `pin` validated against store `cash_pin`)
- Webhook:
  - `POST /payments/webhook/phonepe` with `X-VERIFY`

## Admin (`/admin`)

- `GET /admin/stores` (no store header)
  - Returns stores with terminal list and configured flags.
  - Query: `active_only=true|false` (default `true`).
- `GET /admin/stores/{store_ref}` (no store header)
  - Returns one store by numeric `id` or `store_code` (case-insensitive).
- `GET /admin/analytics/summary` (no store header)
  - Owner analytics across stores.
  - Query: `period=today|yesterday|last_week|all_time` (default `today`), `active_only=true|false`.
- `GET /admin/analytics/store-insights` (no store header)
  - Owner store insights: top items, AOV, payment split, top channel.
  - Query: `period`, `active_only`, optional `store_ids`, `store_codes`, `top_n` (default `5`).
- `GET /admin/transactions` (no store header)
  - Owner transaction grid across stores with filters/pagination.
  - Common filters: `page`, `size`, `sortBy`, `sortDir`, `period`, `store_ids`, `store_codes`, `order_type`, `payment_status`, `payment_method`, `kds_status`, `channel`, `terminal_id`, `search`, `min_amount`, `max_amount`.
- `GET /admin/kiosk-config` (no store header)
  - Returns all active stores with:
    - `store_id`, `store_code`, `store_name`
    - `pinelabs_configured`
    - `terminals[]`
- `GET /admin/cash-pins` (requires `X-Store-Id`)
  - Returns staff IDs and names only.
- `POST /admin/cache/invalidate` (requires `X-Store-Id`)
  - Clears Redis cache for store metadata/credentials.

### Logs and log settings

- `GET /admin/logs` (no store header)
  - Query params:
    - `lines` (default `200`, max `2000`)
    - `contains` (optional, case-insensitive filter)
  - Returns parsed log entries for table rendering.
- `GET /admin/logs/stream` (no store header, SSE)
  - Query params:
    - `initial_lines` (default `50`)
    - `contains` (optional filter)
  - Emits `message` events with payload type `log`.

Recommended table columns:

- `timestamp`
- `level`
- `logger`
- `message`

## Petpooja (`/petpooja`)

- `POST /petpooja/webhook/menu`
  - Accepts form-urlencoded `restdata` or raw JSON.
  - Resolves store by `petpooja_restaurant_id` mapping.
- `POST /petpooja/callback`
  - Order status callback endpoint.

## Common error codes

- `400` bad request or missing required `X-Store-Id`
- `401` PhonePe webhook signature mismatch
- `404` store/order not found
- `503` upstream/cache dependency unavailable
