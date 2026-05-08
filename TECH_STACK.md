# Plateful — Tech Stack Reference

A reusable reference for building full-stack web apps with this architecture.

---

## Frontend

| Tool | Version | Role |
|---|---|---|
| **React** | 19 | UI component library |
| **Vite** | 8 | Dev server and build tool (replaces CRA) |
| **TypeScript** | 6 | Type safety across all client code |
| **React Router DOM** | 7 | Client-side routing, `<BrowserRouter>`, `<Routes>`, `useNavigate`, `useParams` |
| **Tailwind CSS** | 4 | Utility-first styling via `@tailwindcss/vite` plugin |
| **Axios** | 1 | HTTP client with request interceptor for auth token injection |
| **Socket.io-client** | 4 | WebSocket client for real-time order status updates |
| **React Hot Toast** | 2 | Toast notifications |

### Frontend Patterns Used
- **Context + Provider** — `AuthContext` and `CartContext` for global state (no Redux needed for medium-sized apps)
- **Axios interceptor** — auto-injects `Authorization: Bearer <token>` from `localStorage` on every request
- **Protected routes** — `PrivateRoute` wrapper checks auth before rendering pages
- **Auto guest session** — silently creates a guest token if unauthenticated user tries to act (add to cart)
- **Socket.io room per resource** — client joins `order:<id>` room for targeted real-time updates

---

## Backend

| Tool | Version | Role |
|---|---|---|
| **Node.js** | 18+ | Runtime (v25 used here) |
| **Express** | 5 | HTTP server and routing |
| **Prisma ORM** | 5 | Type-safe DB queries, migrations, schema management |
| **PostgreSQL** | 16 | Relational database |
| **Socket.io** | 4 | WebSocket server, shared via `app.locals.io` |
| **bcryptjs** | 3 | Password hashing |
| **jsonwebtoken** | 9 | JWT signing and verification |
| **uuid** | 11 | Guest session ID generation |
| **Razorpay SDK** | 2 | Payment order creation and HMAC signature verification |
| **dotenv** | 17 | Environment variable loading |
| **cors** | 2 | Cross-origin request handling |

### Backend Patterns Used
- **JWT auth middleware** — `authenticate` verifies token; `requireAdmin` checks role — composable per route
- **Controller / Route separation** — `routes/` only wires URLs, all logic lives in `controllers/`
- **MOCK_PAYMENT flag** — bypasses payment provider in dev; swap env var to go live
- **Socket.io via `app.locals`** — shares the `io` instance with all controllers without circular imports
- **Prisma migrations** — schema changes tracked in `prisma/migrations/`, run with `npx prisma migrate dev`

---

## Testing

| Tool | Where | Role |
|---|---|---|
| **Vitest** | Client | Test runner (Vite-native, replaces Jest on frontend) |
| **React Testing Library** | Client | Renders components, fires events, asserts DOM |
| **@testing-library/jest-dom** | Client | Extra matchers (`toBeInTheDocument`, etc.) |
| **jsdom** | Client | Simulated browser DOM for Vitest |
| **Jest** | Server | Test runner for Node.js |
| **Supertest** | Server | Makes real HTTP requests against the Express app in tests |

### Test File Conventions
```
client/src/__tests__/MenuItem.test.tsx       # component render + interaction
client/src/__tests__/CartDrawer.test.tsx
client/src/__tests__/OrderTrackPage.test.tsx

server/__tests__/auth.test.js                # route: happy path + error cases
server/__tests__/menu.test.js
```

Run tests:
```bash
cd client && npm test          # Vitest
cd server && npm test          # Jest
```

---

## Dev Tooling

| Tool | Role |
|---|---|
| **Git** | Version control — one commit per feature phase |
| **GitHub CLI (`gh`)** | Create repos, manage PRs from terminal |
| **Prisma Studio** | Visual DB browser — `npx prisma studio` (opens on localhost:5555) |
| **node --watch** | Built-in Node.js file watcher (replaces nodemon in Node 18+) |

---

## Project Structure

```
project/
├── client/                    # React + Vite
│   ├── src/
│   │   ├── api/               # Axios functions per domain (auth, menu, cart, orders)
│   │   ├── components/        # Reusable UI (Navbar, CartDrawer, MenuItem, etc.)
│   │   ├── context/           # AuthContext, CartContext
│   │   ├── pages/             # One file per route
│   │   └── __tests__/         # Vitest tests
│   ├── .env.example
│   └── vite.config.ts
│
└── server/                    # Node + Express
    ├── controllers/           # Business logic
    ├── routes/                # URL wiring only
    ├── middleware/            # auth.js (authenticate, requireAdmin)
    ├── prisma/
    │   ├── schema.prisma      # DB schema
    │   └── migrations/        # Auto-generated SQL
    ├── __tests__/             # Jest + Supertest
    └── .env.example
```

---

## Environment Variables

```bash
# server/.env
DATABASE_URL=postgresql://USER@localhost:5432/dbname
JWT_SECRET=...
JWT_REFRESH_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
MOCK_PAYMENT=true              # set false in production
CLIENT_URL=http://localhost:5173
PORT=4000

# client/.env
VITE_API_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=...
```

---

## Quick-Start Commands

```bash
# Database
createdb <dbname>
cd server && npx prisma migrate dev --name init
npx prisma studio                     # visual DB browser

# Dev servers
cd server && npm run dev              # Express on :4000
cd client && npm run dev              # Vite on :5173

# Tests
cd server && npm test
cd client && npm test

# GitHub
gh repo create <name> --public --source . --remote origin --push
```

---

## Key Decisions & Why

| Decision | Reason |
|---|---|
| Prisma 5 over 7 | Prisma 7 removed `url` from schema.prisma — v5 uses the standard `DATABASE_URL` env var, simpler and widely documented |
| `node --watch` over nodemon | Built into Node 18+, no extra dependency |
| Socket.io rooms per order | Avoids broadcasting status updates to all connected clients — only the relevant order page receives updates |
| Guest auto-session | Forces users to log in before adding to cart creates friction — silently issuing a guest JWT lets them shop immediately |
| sessionStorage for welcome modal | Persists for the tab session but resets on new tab/window — right balance between not annoying returning users and greeting new ones |
| MOCK_PAYMENT env flag | Lets full order flow be tested without real payment keys — single env var switch to go live |
