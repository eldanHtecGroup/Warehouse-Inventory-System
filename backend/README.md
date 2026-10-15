# Warehouse Inventory – Backend

Express 5 REST API with a SQLite database (`better-sqlite3`), organised as a layered
**Route → Controller → Service → Repository** architecture.

## Getting started

```bash
cp .env.example .env
npm install
npm run db:seed   # optional: sample categories and products
npm run dev       # http://localhost:5000/api
```

| Script                     | Description                                      |
| -------------------------- | ------------------------------------------------ |
| `npm run dev`              | Start with auto-restart on file changes          |
| `npm start`                | Start the server                                 |
| `npm test`                 | Run all tests (unit + integration, in-memory DB) |
| `npm run test:unit`        | Run unit tests only                              |
| `npm run test:integration` | Run HTTP integration tests only                  |
| `npm run test:coverage`    | All tests with coverage report; fails below 70%  |
| `npm run db:seed`          | Insert sample data into an empty database        |
| `npm run db:reset`         | Wipe all data and reseed                         |

The database file is created at `data/inventory.db` (configurable via `DB_PATH`).
The schema in [src/db/schema.sql](src/db/schema.sql) is applied automatically on startup.

## Project structure

```
src/
├── config/        environment configuration
├── db/            connection, schema, seed script
├── docs/          OpenAPI specification
├── routes/        URL → validation → controller
├── controllers/   HTTP layer: read validated request, call service, send response
├── services/      business rules (stock never below zero, history recording, uniqueness)
├── repositories/  SQL queries and row ↔ object mapping
├── validators/    zod schemas for params, query and body
├── middlewares/   requestLogger, validate, notFound, errorHandler
└── utils/         ApiError, logger, constants

tests/
├── setup.js       preloaded: test env, in-memory DB, silent logs
├── helpers/       fake req/res/logger
├── unit/          controllers, services (mocked repositories), repositories,
│                  validators, middlewares, utils
└── integration/   full HTTP tests against the running app
```

## Testing

Tests use the built-in Node.js test runner; coverage is measured with [c8](https://github.com/bcoe/c8)
(config in [.c8rc.json](.c8rc.json)). `npm run test:coverage` runs the unit and integration
tests, enforces **at least 70%** statement, branch, function and line coverage, and writes an
HTML report to `coverage/index.html`. `src/server.js` (process bootstrap) and `src/db/seed.js`
(CLI script) are excluded.

## Error handling and logging

- **Logger**: [pino](https://getpino.io) ([src/utils/logger.js](src/utils/logger.js)). JSON lines
  in production, pretty output in development, silent in tests. Level via `LOG_LEVEL`.
- **Request logging**: one access log line per request with method, URL, status and
  response time. Each request gets an id (`X-Request-Id` header, reused if the client sends
  one) that appears in every log line for that request and in error responses.
- **Global error handler** ([src/middlewares/errorHandler.js](src/middlewares/errorHandler.js)):
  every error thrown in a route (sync or async) ends up here.
  - Known errors (`ApiError`, malformed JSON, oversized body, DB constraint violations)
    become the matching 4xx response and are logged at `warn`.
  - Errors carrying a 5xx status (e.g. `503`) keep that status with its standard message;
    anything else becomes a generic `500 Internal Server Error`. Internal details are never
    sent to the client, and the error is logged at `error` with the full stack trace.
- **Process-level handlers** ([src/server.js](src/server.js)): `uncaughtException`,
  `unhandledRejection` and server startup errors are logged at `fatal`, then the process
  shuts down gracefully (10s timeout) with exit code 1 so a process manager can restart it.
  `SIGINT`/`SIGTERM` close the HTTP server and database cleanly.

Error response format:

```json
{ "error": { "message": "Validation failed", "details": [{ "field": "body.price", "message": "..." }], "requestId": "6f1c..." } }
```

## API documentation

With the server running:

| URL                                         | Description                                      |
| ------------------------------------------- | ------------------------------------------------ |
| http://localhost:5000/api/docs              | Interactive Swagger UI ("Try it out" works)      |
| http://localhost:5000/api/docs/openapi.json | OpenAPI 3.1 spec (JSON)                          |
| http://localhost:5000/api/docs/openapi.yaml | OpenAPI 3.1 spec (YAML)                          |

The spec lives in [src/docs/openapi.yaml](src/docs/openapi.yaml); update it whenever an
endpoint changes. A test checks that every documented operation is actually routed.
To get a Postman collection, use Postman's **Import** with the `openapi.json` URL or the
YAML file.

## API

All responses are JSON. Successful responses use `{ data }` (plus `meta` for paginated
lists); errors use `{ error: { message, details? } }`.

### Categories

| Method | Path                            | Description                                   |
| ------ | ------------------------------- | --------------------------------------------- |
| GET    | `/api/categories`               | List categories (with `productCount`)         |
| GET    | `/api/categories/stock-summary` | Total products, stock and value per category  |
| GET    | `/api/categories/:id`           | Get one category                              |
| POST   | `/api/categories`               | Create `{ name, description? }`               |
| PATCH  | `/api/categories/:id`           | Update `name` and/or `description`            |
| DELETE | `/api/categories/:id`           | Delete (409 if it still has products)         |

### Products

| Method | Path                                  | Description                                     |
| ------ | ------------------------------------- | ----------------------------------------------- |
| GET    | `/api/products`                       | List with filtering, sorting and pagination     |
| GET    | `/api/products/:id`                   | Product details                                 |
| POST   | `/api/products`                       | Create `{ name, code, price, categoryId, quantity?, description? }` |
| PATCH  | `/api/products/:id`                   | Update info (`quantity` is not allowed here)    |
| DELETE | `/api/products/:id`                   | Delete (history is kept)                        |
| POST   | `/api/products/:id/stock/increase`    | `{ quantity, reason? }` – add stock (422 above the maximum) |
| POST   | `/api/products/:id/stock/decrease`    | `{ quantity, reason? }` – remove stock (422 if insufficient) |
| GET    | `/api/products/:id/stock-movements`   | Stock history of one product                    |

`GET /api/products` query parameters:

| Param                         | Example              | Notes                                                           |
| ----------------------------- | -------------------- | --------------------------------------------------------------- |
| `search`                      | `cola`               | Case-insensitive match on name or code                          |
| `categoryId`                  | `2`                  |                                                                 |
| `minPrice` / `maxPrice`       | `1.5` / `10`         |                                                                 |
| `minQuantity` / `maxQuantity` | `0` / `20`           | e.g. `maxQuantity=10` for low stock                             |
| `inStock`                     | `true` / `false`     | `false` returns out-of-stock products                           |
| `sortBy`                      | `price`              | `name` (default), `code`, `price`, `quantity`, `category`, `createdAt`, `updatedAt` |
| `order`                       | `desc`               | `asc` (default) or `desc`                                       |
| `page` / `limit`              | `1` / `20`           | `limit` max 100                                                 |

### Stock history

| Method | Path                    | Description                              |
| ------ | ----------------------- | ---------------------------------------- |
| GET    | `/api/stock-movements`  | All stock changes, newest first          |

Query parameters: `productId`, `type` (`INITIAL`, `INCREASE`, `DECREASE`, `REMOVED`),
`from` / `to` (ISO dates), `order`, `page`, `limit`. The same filters except `productId`
apply to `/api/products/:id/stock-movements`.

Each movement records `quantityChange`, `quantityBefore`, `quantityAfter`, an optional
`reason`, and a snapshot of the product's name and code, so history remains readable
after a product is deleted.

## Design notes

- **Stock never goes below zero**: enforced in the service layer (422 response) and by a
  `CHECK (quantity >= 0)` constraint in the database.
- **Maximum stock**: a product holds at most 1,000,000,000 units (`MAX_STOCK_QUANTITY` in
  [src/utils/constants.js](src/utils/constants.js)). Larger initial quantities or adjustments
  are rejected (400), and an increase that would exceed it is rejected (422) without changing
  anything. This keeps quantities, history and stock values exact (JavaScript numbers lose
  precision above 2^53).
- **Every stock change is audited**: quantity can only change through the stock
  endpoints (or product creation/deletion), and the update plus its history record run
  in a single transaction.
- **Prices** are stored as integer cents and exposed as decimal numbers (max 2 decimals).
- **Codes and category names** are unique, case-insensitively.
