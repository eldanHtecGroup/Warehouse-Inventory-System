# Warehouse Inventory — Frontend

React + Vite single-page app for the Warehouse Inventory System, using a **layer-based (package by type)** architecture. It talks to the Express API in [`../backend`](../backend).

## Features

| Requirement                                   | Where                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Add, update and remove products               | **Products** → *Add product*, *Edit*, *Delete* (also on the product page)                 |
| View product details (name, price, code, ...) | **Products** → click a product name                                                       |
| Sort and filter products                      | **Products**: click column headers to sort; filter by search, category, stock, price, quantity |
| Increase / decrease stock                     | *Adjust stock* on the product list (modal) or the product page                            |
| Prevent stock from going below zero           | The form blocks it before sending; the backend also rejects it (`422`)                    |
| Total stock per category                      | **Dashboard** → *Stock by category*; **Categories** page                                   |
| History of all inventory changes              | **History** page (filter by type, date range, product); per-product history on its page   |
| Organize items into categories                | **Categories** page: add, rename, delete (only when the category is empty)                |

Filters, sorting and pagination are kept in the URL, so a filtered view can be bookmarked or shared.

## Getting started

```bash
# 1. Backend (from ../backend)
npm install
npm run db:seed        # optional sample data: Beverages, Snacks, Household
npm run dev            # http://localhost:5000

# 2. Frontend (this folder)
cp .env.example .env   # optional, the defaults work out of the box
npm install
npm run dev            # http://localhost:5173
```

The dev server proxies `/api` to the backend (`VITE_API_PROXY_TARGET`, default `http://localhost:5000`), so no CORS setup is needed in development.

## Environment variables

| Variable                | Default                 | Description                                     |
| ----------------------- | ----------------------- | ----------------------------------------------- |
| `VITE_API_BASE_URL`     | `/api`                  | Base URL for API requests                       |
| `VITE_API_PROXY_TARGET` | `http://localhost:5000` | Backend the dev server proxies `/api` to        |
| `VITE_CURRENCY`         | `USD`                   | ISO 4217 currency code used to display prices   |

## Scripts

| Script                  | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`           | Start the dev server                                 |
| `npm run build`         | Production build into `dist/`                        |
| `npm run preview`       | Serve the production build                           |
| `npm run lint`          | Run ESLint                                           |
| `npm test`              | Run the unit tests once                              |
| `npm run test:watch`    | Run the unit tests in watch mode                     |
| `npm run test:coverage` | Run the tests with coverage (HTML report in `coverage/`) |

## Tests

Unit tests use [Vitest](https://vitest.dev) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) in a jsdom environment. They live in `tests/`, mirroring the `src/` layers (same layout as the backend):

```
tests/
├── setup.js          # jest-dom matchers, cleanup, <dialog> polyfill for jsdom
├── helpers/          # renderWithProviders (router + toasts), response fixtures
└── unit/
    ├── api/          # httpClient (fetch mocked) and resource modules
    ├── components/   # UI components and forms
    ├── context/      # toast notifications
    ├── hooks/        # useFetch, useQueryParams, useCategories
    ├── pages/        # pages with the api layer mocked via vi.spyOn
    ├── routes/       # routing and App bootstrapping
    └── utils/
```

`npm run test:coverage` fails if statements, branches, functions or lines drop below **70%** (configured in `vite.config.js`).

## Project structure

```
src/
├── api/              # HTTP layer: httpClient + one module per backend resource
│                     #   category.api.js, product.api.js, stockMovement.api.js
├── assets/           # Images, icons, fonts imported by components
├── components/       # Presentational UI, grouped by domain
│   ├── common/       #   Generic building blocks (Modal, Pagination, FormField, ...)
│   ├── category/     #   CategoryForm, CategoryTable, CategoryStockTable
│   ├── product/      #   ProductTable, ProductFilters, ProductForm, StockAdjustForm, ...
│   ├── stockMovement/#   MovementTable, MovementFilters, MovementTypeBadge
│   └── Navbar.jsx
├── config/           # App configuration read from env variables
├── constants/        # Route paths, movement types, limits mirrored from the backend
├── context/          # React context providers (toast notifications)
├── hooks/            # useFetch, useQueryParams, useCategories, useToast
├── layouts/          # Page shell (navbar + <Outlet />)
├── pages/            # Route-level screens: Dashboard, Products, ProductDetail,
│                     #   ProductForm, Categories, History, NotFound
├── routes/           # Route definitions (AppRouter)
├── styles/           # Global CSS (design tokens, light/dark theme)
├── utils/            # Pure helpers: formatters, query strings, API error mapping
├── App.jsx           # Root component (router + providers)
└── main.jsx          # Entry point
```

Dependency direction: `pages` → `components` / `hooks` → `api` → `config`. Pages never call `fetch` directly; they go through the `api` layer, which unwraps the backend's `{ data }` envelope and turns `{ error }` responses into an `ApiError` (validation `details` are mapped onto form fields).
