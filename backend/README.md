# Bu Nihon backend

NestJS API with PostgreSQL, HttpOnly-cookie authentication, Resend email verification, and Google OAuth.

## Start

1. Copy `.env.example` to `.env` and set strong, different values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
2. Add `RESEND_API_KEY` and an approved `RESEND_FROM_EMAIL`.
3. Add Google OAuth credentials and register `GOOGLE_CALLBACK_URL` in Google Cloud Console.
4. Run `docker compose up --build`.
5. Check `GET http://localhost:3001/api/health`.

The frontend must use `NEXT_PUBLIC_API_URL=http://localhost:3001/api`.

## Authentication

All API routes are protected by the global cookie JWT guard unless explicitly decorated with `@Public()`. Public auth routes cover registration, OTP confirmation, login, refresh/logout, password reset, and Google OAuth. Access cookies last 15 minutes; refresh sessions rotate and last 30 days.

Use `http://localhost:3000` as `FRONTEND_URL` and `CORS_ORIGIN` in development. Configure `COOKIE_DOMAIN`, HTTPS, and production origins before deployment.

` synchronize` is enabled only outside production. Use migrations for production schema changes.