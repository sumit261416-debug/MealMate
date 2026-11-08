# MealMate NCR

Daily tiffin marketplace for a bounded NCR pilot.

## Stack

- **Admin + web:** Next.js (`apps/web`)
- **API:** Node.js + Express + Prisma + PostgreSQL (`apps/api`)
- **Mobile (later):** Flutter customer + partner apps

## Admin panel (Phase 1 + ops polish)

Screens: login, dashboard, partners, customers, menus, orders, deliveries, refunds, payments, service config, support, audit log.

See also `docs/DEPLOYMENT.md` for staging/production hardening checklist.

Security baseline:

- Admin-only JWT (`audience: mealmate-admin`)
- HttpOnly session cookie on the web BFF (token not in `localStorage`)
- Argon2id passwords
- Rate-limited login
- Server-side role checks on every `/v1/admin/*` route
- Audited partner/menu/config/support changes
- Pagination caps; no bulk export

## Local setup

### 1. PostgreSQL

```bash
brew install postgresql@16
brew services start postgresql@16
createuser -s mealmate || true
createdb mealmate -O mealmate || createdb mealmate
psql -d mealmate -c "ALTER USER mealmate WITH PASSWORD 'mealmate';" || true
```

Or any Postgres instance — set `DATABASE_URL` accordingly.

### 2. Environment

```bash
cp .env.example apps/api/.env
# edit JWT_SECRET to a long random value
cp .env.example apps/web/.env.local
# keep API_BASE_URL=http://localhost:4000
```

### 3. Install & migrate

```bash
npm install
cd apps/api && npx prisma migrate dev --name init && npm run db:seed
```

Default admin (change after first login in real deploys):

- Email: `admin@mealmate.local`
- Password: value of `ADMIN_BOOTSTRAP_PASSWORD` (see `.env.example`)

### 4. Run

```bash
# terminal 1
npm run dev:api

# terminal 2
npm run dev:web
```

Open http://localhost:3000/login

## Verification honesty

Until you run migrate/seed/dev servers yourself on a live Postgres, DB connectivity is **NOT VERIFIED** in a fresh clone.
