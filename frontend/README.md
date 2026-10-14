# Warehouse Inventory — Frontend

React + Vite app using a **layer-based (package by type)** architecture.

## Getting started

```bash
cp .env.example .env   # optional, the defaults work out of the box
npm install
npm run dev            # http://localhost:5173
```

The dev server proxies `/api` to the backend (`http://localhost:5000` by default), so start the backend too.

## Scripts

| Script            | Description                   |
| ----------------- | ----------------------------- |
| `npm run dev`     | Start the dev server          |
| `npm run build`   | Production build into `dist/` |
| `npm run preview` | Serve the production build    |
| `npm run lint`    | Run ESLint                    |

## Project structure

```
src/
├── api/          # HTTP client + one module per backend resource (item.api.js, ...)
├── assets/       # Images, icons, fonts imported by components
├── components/   # Reusable UI components
│   └── common/   # Generic building blocks (Loader, ErrorMessage, ...)
├── config/       # App configuration read from env variables
├── constants/    # App-wide constants (route paths, ...)
├── context/      # React context providers for shared state
├── hooks/        # Custom hooks (useFetch, ...)
├── layouts/      # Page shells (navbar + <Outlet />)
├── pages/        # Route-level components, one per screen
├── routes/       # Route definitions (AppRouter)
├── styles/       # Global CSS
├── utils/        # Pure helper functions
├── App.jsx       # Root component (router setup)
└── main.jsx      # Entry point
```

Dependency direction: `pages` → `components` / `hooks` → `api` → `config`. Pages never call `fetch` directly; they go through the `api` layer.
