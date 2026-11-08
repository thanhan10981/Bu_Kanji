# Bu Nihon backend

NestJS API with PostgreSQL, HttpOnly-cookie authentication, email/password signup without email
verification, optional Resend password recovery, and Google OAuth.

## Start

1. Copy `.env.example` to `.env` and set strong, separate values of at least 32 characters for
   `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and `AUTH_RATE_LIMIT_SECRET`.
2. Optionally add `RESEND_API_KEY` and an approved `RESEND_FROM_EMAIL` for password recovery.
3. Optionally add Google OAuth credentials and register `GOOGLE_CALLBACK_URL` in Google Cloud Console.
4. Run `docker compose up --build`.
5. Check `GET http://localhost:3001/api/health`.

Prefer same-origin `NEXT_PUBLIC_API_URL=/api` and `API_PROXY_TARGET=http://127.0.0.1:3001`
for the existing Next rewrite. Run `npm run migrate` against the intended database before startup,
including in development: synchronize alone does not create the normalized email index.

## Authentication

All API routes are protected by the global cookie JWT guard unless explicitly decorated with `@Public()`. Public auth routes cover registration, OTP confirmation, login, refresh/logout, password reset, and Google OAuth. Access cookies last 15 minutes; refresh sessions rotate and last 30 days.

Use `http://localhost:3000` as `FRONTEND_URL` and `CORS_ORIGIN` in development. Configure `COOKIE_DOMAIN`, HTTPS, and production origins before deployment.

` synchronize` is enabled only outside production. Use migrations for production schema changes.

Registration returns HTTP 201 `{ user }` and the same session cookies as login. It automatically
signs the user in, keeps `emailVerified=false` and sends no mail. User, password identity and refresh
session commit together; duplicate normalized email returns 409. Passwords use salted Argon2id
(65536 KiB memory, 3 iterations, parallelism 4), with existing hashes still accepted.

Login attempts (including successful logins and unknown emails) share PostgreSQL quotas:
5/email and 30/IP per 900 seconds from each scope's first attempt. Exceeded quota returns 429 and
`Retry-After`; unavailable quota storage returns 503. `AUTH_LOGIN_EMAIL_LIMIT`, `AUTH_LOGIN_IP_LIMIT`
and `AUTH_LOGIN_WINDOW_SECONDS` can adjust positive limits; they cannot disable the limiter.
Expired counters are cleaned hourly in bounded batches, including without login traffic.

IP uses the socket by default. Set `AUTH_TRUSTED_PROXY_CIDRS` only to verified proxy addresses/CIDRs;
test Next/Vercel → API and direct API paths. Do not use arbitrary `X-Forwarded-For` as an identity.
Deploy frontend/backend together because register changed from message-only to `{ user }`.
Apply migration 005 before the new backend; canonical duplicates stop migration without merging.
Application rollback keeps the additive table/index and account data; do not modify migrations 001–004.

Validation: see `../specs/002-email-password-auth/quickstart.md`. `npm run test:auth` runs service,
HTTP, validation, embedded PostgreSQL SQL and limiter tests. Real PostgreSQL integration requires
an isolated local `TEST_DATABASE_URL` containing `test` in its database name, distinct from DATABASE_URL.
