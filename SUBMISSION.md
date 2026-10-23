# Tenant member management submission

## Implemented

- A tenant members page shows name, email, role, and account status, with loading, error, and empty states. It supports page sizes, name/email search, and role filtering.
- Admins can change another member's role in a dialog. The page updates after success and shows useful errors after failure. Self-demotion is blocked in both the UI and API.
- NestJS lists and updates memberships through Prisma. Member responses use `success`, `message`, `error`, and `data`.
- The API checks current PostgreSQL membership for every member request. Role changes check the actor's current admin role inside a serializable transaction and update only the requested tenant/member pair.
- Server validation accepts only `ADMIN` and `MEMBER`, rejects extra request fields, and returns 400/401/403/404/409 responses where appropriate.

## Decisions and assumptions

- `x-tenant-id` selects an organization but proves no access. The portal resolves the selected slug through `/auth/me`; the NestJS API independently checks current database membership.
- JWTs identify a user by `sub`. Tenant roles are read from PostgreSQL so a role change takes effect without waiting for a token to expire.
- Account status belongs to a user, while role belongs to a tenant membership. The migration defaults existing users to `ACTIVE`. Editing account status is outside this assessment.
- The API keeps the earlier default of 25 members per page for callers that omit `pageSize`; the portal defaults to 20. Search and role filtering happen before counting and paging.

## Verification

- `corepack pnpm --filter api test`: **35 passed**.
- `corepack pnpm --filter api lint` and `corepack pnpm --filter api build`: passed.
- `corepack pnpm --filter portal lint` and `corepack pnpm --filter portal exec next build --webpack`: passed.
- `corepack pnpm --filter api test:e2e`: could not run here; the sandbox rejects the test server's `127.0.0.1` port bind with `EPERM`.
- A live PostgreSQL migration, seed, and browser walkthrough could not be completed here. The configured database did not respond, Docker access was denied, and a direct Prisma seed attempt failed with `EPERM` before reading data.

## Where I disagreed with the repo or my AI

- The original `AGENTS.md` suggested trusting the tenant header and authorizing from JWT role claims. Those values can be stale or client selected, so the member API checks PostgreSQL instead. I removed the unused claim-based helper and role claims from new JWTs.
- The original guidance suggested relying on form controls for role values and caching member reads. The API validates roles and rejects extra fields; member reads are uncached so role changes appear promptly.
- I kept previously requested pagination, filters, shared portal controls, and demo seed accounts. They are optional to the assessment but support the requested member workflow. I removed the unused authorization helper rather than keeping a second, unsafe path.

## Incomplete checks and next steps

- **Live persistence and UI flow are unverified in this environment.** On a machine with PostgreSQL and Docker access, run `pnpm db:up`, `pnpm db:deploy`, `pnpm db:seed`, then sign in as `alice`. Check Acme and Globex isolation, role changes after refresh, self-demotion, invalid roles, and the loading/error/empty states.
- The repository's separate Railway/Vercel hosting tasks are not completed; no live URLs are provided.

Before production, I would prioritize:

1. Remove demo accounts and the shared test password, and decide whether `INACTIVE` users may log in. This closes obvious account access risks.
2. Add PostgreSQL-backed integration tests and browser tests for role updates and all page states. These catch migration, transaction, and UI problems that mocked service tests cannot.
3. Record who changed each role and when, so administrators can investigate mistakes. If member lists grow, add suitable search indexes so name/email filtering does not scan every member.
