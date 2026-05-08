# Plateful — Claude Session Guide

Full-stack restaurant ordering app. Users browse an Indian food menu, add items to cart, checkout with Razorpay (or mock payment in dev), and track their order live via Socket.io.

---

## Start the Servers

```bash
# Terminal 1 — backend (port 4000)
cd server && npm run dev

# Terminal 2 — frontend (port 5173)
cd client && npm run dev
```

Both must be running. If port 4000 is already in use:
```bash
kill $(lsof -ti:4000)
```

---

## Project Structure

```
plateful/
├── server/
│   ├── index.js                    # Entry point — Express + Socket.io setup
│   ├── middleware/auth.js          # authenticate, requireAdmin
│   ├── routes/                     # auth, menu, cart, orders, payment
│   ├── controllers/
│   │   ├── authController.js       # register, login, guest, me
│   │   ├── menuController.js       # getMenu, getMenuItem, createMenuItem, ...
│   │   ├── cartController.js       # getCart, addItem, updateItem, removeItem, mergeCart
│   │   └── orderController.js      # createOrder, verifyPayment, getOrder, updateOrderStatus
│   ├── prisma/
│   │   ├── schema.prisma           # DB schema (User, MenuItem, Cart, CartItem, Order, OrderItem)
│   │   └── migrations/             # Auto-generated SQL — do not edit manually
│   ├── __tests__/                  # Jest + Supertest (auth.test.js, menu.test.js)
│   ├── .env                        # Real env vars — not committed
│   └── .env.example                # Template
│
└── client/
    └── src/
        ├── api/                    # axios.ts, auth.ts, menu.ts, cart.ts, orders.ts
        ├── context/                # AuthContext.tsx, CartContext.tsx
        ├── components/             # Navbar, MenuItem, CartDrawer, OrderStatus, WelcomeModal
        ├── pages/                  # HomePage, LoginPage, MenuPage, CheckoutPage, OrderTrackPage, OrdersPage
        ├── __tests__/              # Vitest + RTL (MenuItem, CartDrawer, OrderTrackPage)
        └── test/setup.ts           # @testing-library/jest-dom import
```

---

## Database

- **Engine:** PostgreSQL 16 (Homebrew, running via launchd)
- **DB name:** `plateful`
- **ORM:** Prisma 5

```bash
# Check DB is running
brew services list | grep postgresql

# Open visual DB browser
cd server && npx prisma studio        # localhost:5555

# Apply schema changes
cd server && npx prisma migrate dev --name <description>

# Regenerate Prisma client after schema change
cd server && npx prisma generate

# Direct psql access
psql plateful
```

---

## Environment Variables

### `server/.env`
```
DATABASE_URL=postgresql://rakshithkumar@localhost:5432/plateful
JWT_SECRET=plateful_jwt_secret_change_in_production
JWT_REFRESH_SECRET=plateful_refresh_secret_change_in_production
RAZORPAY_KEY_ID=placeholder          # replace with real key when going live
RAZORPAY_KEY_SECRET=placeholder
MOCK_PAYMENT=true                    # set false + add real keys for live payments
CLIENT_URL=http://localhost:5173
PORT=4000
```

### `client/.env`
```
VITE_API_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=               # leave blank in mock mode
```

---

## Key Behaviours to Know

### Auth & Sessions
- JWT stored in `localStorage` as `plateful_token`
- Guest session ID stored as `plateful_guest_session`
- Unauthenticated users who click "Add to Cart" get a silent guest session created automatically
- On login/register, guest cart is merged into user cart via `POST /api/cart/merge`
- `WelcomeModal` shows once per browser session (guarded by `sessionStorage`)

### Payment
- `MOCK_PAYMENT=true` → orders auto-confirm, no Razorpay modal shown
- `MOCK_PAYMENT=false` → real Razorpay checkout modal, HMAC signature verified server-side
- To go live: add real Razorpay keys to `server/.env` + `client/.env`, set `MOCK_PAYMENT=false`

### Real-time Order Tracking
- Socket.io runs on the same port as Express (shared `httpServer`)
- Client joins room `order:<orderId>` on the OrderTrack page
- Admin calls `PATCH /api/orders/:id/status` → server emits `order:status_update` to that room
- `io` instance is shared via `app.locals.io` — no circular imports

---

## API Endpoints

```
POST   /api/auth/register          body: { name, email, password }
POST   /api/auth/login             body: { email, password }
POST   /api/auth/guest             → { token, sessionId, user }
GET    /api/auth/me                requires: auth

GET    /api/menu                   query: ?category=
GET    /api/menu/:id
POST   /api/menu                   requires: admin
PATCH  /api/menu/:id               requires: admin
DELETE /api/menu/:id               requires: admin

GET    /api/cart                   requires: auth
POST   /api/cart/items             body: { menuItemId, quantity }
PATCH  /api/cart/items/:id         body: { quantity }
DELETE /api/cart/items/:id
POST   /api/cart/merge             body: { sessionId }

POST   /api/orders                 body: { address }
GET    /api/orders/my
GET    /api/orders/:id
PATCH  /api/orders/:id/status      body: { status } — requires: admin

POST   /api/payment/verify         body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId }
```

---

## Running Tests

```bash
cd server && npm test       # Jest + Supertest — hits real DB (test data cleaned up after)
cd client && npm test       # Vitest + React Testing Library
```

---

## Menu Items

13 Indian food items seeded directly via `psql`. Categories:
- Starters — Samosa, Chicken Tikka
- Main Course — Butter Chicken, Paneer Tikka Masala, Dal Makhani
- Rice & Biryani — Chicken Biryani, Vegetable Biryani
- Breads — Garlic Naan, Laccha Paratha
- Beverages — Masala Chai, Mango Lassi
- Desserts — Gulab Jamun, Mango Kulfi

To add more items, use Prisma Studio or POST `/api/menu` with an admin token.

---

## GitHub

- **Repo:** https://github.com/aturirakshith/plateful
- **Branch:** `main`
- **Push:** `git push origin main`

---

## Known Issues Fixed (History)

| Issue | Fix |
|---|---|
| `uuid` not found on server start | Installed `uuid` in `server/` (was accidentally in `client/`) |
| `OrderStatus` name clash in `OrderTrackPage.tsx` | Aliased type import to `OrderStatusType` |
| Guest user `id: ''` broke order creation | Guest endpoint now returns user object; `AuthContext` uses real ID |
| Cart appeared empty on Checkout page | Separated `cart === null` (loading) from `cart.items.length === 0` (truly empty) |
| Adding to cart without login returned 401 | `CartContext.addItem` auto-calls `continueAsGuest()` if unauthenticated |
| Prisma 7 rejected `url` in `schema.prisma` | Downgraded to Prisma 5 which uses standard `DATABASE_URL` |
