# Tenant Portal

A multi-tenant portal. Users sign in with a username and password and switch between the tenants they belong to. A user can be an **Admin** or a **Member** of each tenant.

| App | Stack | Path | Local URL |
|---|---|---|---|
| API | NestJS 12, Prisma 7, PostgreSQL | `app/api` | http://localhost:3000 |
| Portal | Next.js 16 (App Router), Tailwind CSS 4 | `app/portal` | http://localhost:3001 |

Both apps live in one pnpm workspace and share a single `.env` at the repo root.

> **Doing the assessment?** Start with [TASKS.md](TASKS.md). It explains how to fork this repo, what to build and how to submit.

The implementation and remaining checks are summarized in [SUBMISSION.md](SUBMISSION.md).

## Prerequisites

- Node.js 20.19 or newer
- pnpm 11 (`corepack enable` picks up the version in `package.json`)
- Docker, for the local PostgreSQL database

## Run it locally

```bash
# 1. Install dependencies (this also generates the Prisma client)
pnpm install

# 2. Create your env file
cp .env.example .env

# 3. Start PostgreSQL on localhost:5433
pnpm db:up

# 4. Create the tables and load the sample users
pnpm db:migrate
pnpm db:seed

# 5. Start both apps, each in its own terminal
pnpm api:dev
pnpm portal:dev
```

Open http://localhost:3001 and sign in with one of the test accounts below.

## Test accounts

Every seeded user has the password **`123456`**. Sign in with the username, not the email.

| Username | Tenants (role) |
|---|---|
| `alice` | Acme Corporation (Admin), Globex Industries (Admin) |
| `bob` | Initech (Admin), Acme Corporation (Member) |
| `carol` | Globex Industries (Member), Initech (Member) |
| `dave` | Umbrella Holdings (Admin) |
| `erin` | Stark Enterprises (Admin) |
| `frank` | Wayne Logistics (Admin) |
| `grace` | Hooli (Admin) |
| `heidi` | Umbrella Holdings (Member) |
| `ivan` | Stark Enterprises (Member) |
| `judy` | Hooli (Member) |

Use `alice`, `bob` or `carol` to try the tenant switcher. The dashboard's Admin panel only shows in tenants where you're an Admin. The dashboard numbers are static sample data.

The seeder also adds `acme_member_01` through `acme_member_48` and `globex_member_01` through `globex_member_48`. Each belongs only to its named organization. A fresh database has **50 members in Acme** and **50 in Globex**, including the existing test accounts. These demo accounts use the same password and include both Admin and Member roles.

Running `pnpm db:seed` again is safe. It updates the existing seeded records instead of creating duplicates. Existing members that were added outside the seeder are retained, so an existing database may show more than 50 members.

## Scripts

Run these from the repo root.

| Script | What it does |
|---|---|
| `pnpm api:dev` | Start the API in watch mode |
| `pnpm api:build` / `pnpm api:start` | Build the API / run the build |
| `pnpm portal:dev` | Start the portal in dev mode |
| `pnpm portal:build` / `pnpm portal:start` | Build the portal / run the build |
| `pnpm db:up` / `pnpm db:down` | Start / stop the PostgreSQL container |
| `pnpm db:migrate` | Create and apply migrations after a schema change (development) |
| `pnpm db:deploy` | Apply existing migrations without creating new ones (production) |
| `pnpm db:seed` | Load the test tenants and users |
| `pnpm db:reset` | Drop all data, re-apply migrations and re-seed |

After changing `app/api/prisma/schema.prisma`, run `pnpm db:migrate --name <change>` and then `pnpm --filter api db:generate`.

## Environment variables

All variables live in the root `.env`. `.env.example` lists every one of them.

| Variable | Used by | Purpose |
|---|---|---|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | `docker-compose.yml` | Local PostgreSQL container |
| `DATABASE_URL` | API, Prisma | PostgreSQL connection string |
| `API_PORT` | API | Port the API listens on (falls back to `PORT`, then 3000) |
| `PORTAL_URL` | API | Origin allowed by CORS |
| `JWT_SECRET` | API | Secret that signs access tokens |
| `JWT_EXPIRES_IN` | API | Token lifetime, e.g. `1d` |
| `PORTAL_PORT` | Portal | Port the portal listens on |
| `BACKEND_API_URL` | Portal server | Base URL of the API; older `NEXT_PUBLIC_API_URL` settings also work |

## How it works

- **Login:** the portal posts the username and password to `POST /auth/login`. The API checks the bcrypt hash and returns a JWT. The portal stores it in an httpOnly `session` cookie, so browser JavaScript can't read it.
- **Dashboard:** the portal's server calls `GET /auth/me` with that token to get the user and their tenants. The selected tenant is kept in the URL (`/dashboard?tenant=acme`).
- **Route protection:** `app/portal/src/proxy.ts` sends visitors without a session cookie to `/login`. The dashboard also redirects to `/login` when the API rejects the token, for example once it expires.

### Member management

- The portal's `/members?tenant=acme` page lists the selected organization's members with name, email, role, and account status. It shows loading, error, and empty states. The page has a name/email search, role filter, and page size choices of 10, 20, 30, 40, 50, and 100 (default 20).
- `GET /members?page=1&pageSize=20` accepts optional `search` (name or email) and `role` (`ADMIN` or `MEMBER`). It returns `{ success, message, error, data }`, where `data` includes `members`, `page`, `pageSize`, `total`, and `totalPages`. Direct API calls without `pageSize` still default to 25.
- `PATCH /members/:userId` accepts `{ "role": "ADMIN" }` or `{ "role": "MEMBER" }`. Only an administrator of the selected organization can update a role. The API checks current database membership, prevents self-demotion, and returns the updated member.
- Both API routes require a bearer token and `x-tenant-id`. The API validates tenant access in PostgreSQL; the header alone does not grant access.
- On the members page, each row has an ellipsis menu with View Details and Update Role. Both options open a dialog; admins can update another member's role there. A Server Action reads the httpOnly session cookie and calls the API. The page refreshes and shows a toast after success, or an error when the update fails.
- The members page fetches its initial data from the API in a Server Component. Page, page size, search, and role filter live in the URL. The browser never receives the API token.

For a database created before account status was added, run `pnpm db:deploy` to add the `users.status` column. Existing users default to `ACTIVE`.

### Data model

```
User ──< TenantUser >── Tenant
          role: ADMIN | MEMBER
```

The schema is in `app/api/prisma/schema.prisma`, the migrations are in `app/api/prisma/migrations/` and the seeder is `app/api/prisma/seed.ts`.

## Project structure

```
.
├── .env.example            # every environment variable
├── docker-compose.yml      # local PostgreSQL
├── TASKS.md                # assessment tasks: start here
└── app/
    ├── api/
    │   ├── prisma/         # schema, migrations, seeder
    │   └── src/
    │       ├── auth/       # login, /auth/me, JWT guard
    │       ├── members/    # tenant member list and role update
    │       └── prisma/     # PrismaService
    └── portal/
        └── src/
            ├── app/
            │   ├── login/      # login page and form
            │   ├── dashboard/  # dashboard and tenant switcher
            │   └── members/    # server-fetched list and role Server Action
            ├── components/     # reusable UI components
            ├── lib/            # API client, session cookie, sample data
            ├── types/          # API response and member interfaces
            └── proxy.ts        # redirects signed-out visitors
```

## Troubleshooting

- **`EADDRINUSE` on port 3000 or 3001:** another process already uses the port. Find it with `lsof -nP -iTCP:3000 -sTCP:LISTEN`, then stop it or change `API_PORT` / `PORTAL_PORT` in `.env`.
- **Port 5433 already in use:** change `DB_PORT` in `.env`, and the port inside `DATABASE_URL` to match.
- **"Can't reach the API" on the login page:** make sure `pnpm api:dev` is running and `BACKEND_API_URL` points to it.
