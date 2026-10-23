# AGENTS.md

Conventions for anyone, human or AI assistant, working in this repo. See `README.md` for setup.

## Commands

Run everything from the repo root.

- `pnpm api:dev` / `pnpm portal:dev`: start the apps
- `pnpm db:migrate`: create and apply a migration after editing `app/api/prisma/schema.prisma`, then `pnpm --filter api db:generate`
- `pnpm db:seed`: reload the test tenants and users (password `123456`)
- `pnpm --filter api test`: API unit tests
- `pnpm --filter api lint` and `pnpm --filter portal lint`

## Layout

- `app/api`: NestJS 12, Prisma 7 with PostgreSQL. ESM, so relative imports end in `.js`.
- `app/portal`: Next.js 16 App Router with `cacheComponents` enabled. Read `app/portal/AGENTS.md` before changing portal code.
- The Prisma client is generated into `app/api/src/generated/prisma`. Don't edit it.

## Tenant context

The portal's route handler resolves the selected tenant slug through `/auth/me` and sends its ID in `x-tenant-id` (`apiFetch` in `app/portal/src/lib/api.ts`). The header selects a tenant; member services verify the caller's current membership in PostgreSQL before reading or changing data.

## Authorization

JWTs identify the user by `sub`. For member role changes, check the user's current tenant role in PostgreSQL. Do not authorize from stale role claims or a client-supplied tenant ID.

## API handlers

- Keep controllers thin and put logic in services.
- Validate enum values on the API; form controls are not a security boundary. The global validation pipe rejects unknown body fields.
- Check the actor's current admin membership and update only the selected tenant/member pair in a transaction. Map expected Prisma errors to useful HTTP responses.

## Testing

- Unit-test services with `createPrismaMock()` from `app/api/test/prisma-mock.ts`.
- Don't connect to the database in tests. CI has no PostgreSQL.
- Test files sit next to the code they test as `*.spec.ts`.

## Portal data fetching

- The members page calls its own Next.js route handler through `app/portal/src/lib/members.ts`. The handler reads the httpOnly session cookie, resolves tenant access through `/auth/me`, and forwards the request to NestJS.
- Keep member reads uncached so role updates appear promptly. Mutations also use a portal route handler and are authorized again by NestJS.

## Style

- Match the surrounding code: Prettier defaults, single quotes in the API, double quotes in the portal.
- Keep comments short and only where the code isn't obvious.
