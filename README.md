# Warehouse Inventory System

Inventory management tool for retail stores and warehouses. Products are organised into
categories (e.g. Beverages, Snacks, Household), stock can be increased or decreased but
never below zero, and every change is recorded in a full stock history.

| Part                     | Stack                                   | Details                                  |
| ------------------------ | --------------------------------------- | ---------------------------------------- |
| [backend](backend)       | Node.js 22+, Express 5, SQLite (`better-sqlite3`), zod, pino | [backend/README.md](backend/README.md)   |
| [frontend](frontend)     | React 19, Vite, React Router            | [frontend/README.md](frontend/README.md) |

## Quick start

```bash
# Backend: http://localhost:5000/api (Swagger UI at /api/docs)
cd backend
cp .env.example .env
npm install
npm run db:seed        # optional sample data
npm run dev

# Frontend: http://localhost:5173 (proxies /api to the backend)
cd frontend
npm install
npm run dev
```

The SQLite database is created automatically at `backend/data/inventory.db`.

## Requirements

| Requirement                          | Implementation                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| Add, update and remove products      | Products pages; `POST/PATCH/DELETE /api/products`                              |
| View product details                 | Product page with name, code, price, category, stock and its history           |
| Sort and filter products             | Sort by any column; filter by search, category, price, quantity, availability  |
| Increase or decrease stock           | *Adjust stock* form; `POST /api/products/:id/stock/increase` and `/decrease`   |
| Prevent stock from going below zero  | Checked in the form, the service layer (`422`) and a database `CHECK` constraint |
| Total stock per category             | Dashboard and Categories page; `GET /api/categories/stock-summary`             |
| History of all inventory changes     | History page; every change is stored in `stock_movements`, kept even after a product is deleted |
| Unit test coverage of at least 70%   | Enforced by `npm run test:coverage` in both projects                           |
| Global error catching and logging    | Backend: central error handler, process-level handlers, structured pino logs with request ids. Frontend: error boundaries, global `error`/`unhandledrejection` handlers, logging of failed API calls |
| Lightweight local relational database | SQLite                                                                         |

A product holds at most 1,000,000,000 units, so quantities and history stay exact.

## Testing

```bash
cd backend && npm run test:coverage    # unit + integration tests, in-memory database
cd frontend && npm run test:coverage   # Vitest + React Testing Library
```

Both commands fail if statement, branch, function or line coverage drops below 70%.
