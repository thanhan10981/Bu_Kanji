# Deploy with `vothanhan.dev`

Deploy two Vercel projects from this repository:

| Project | Root directory | Domain |
| --- | --- | --- |
| Frontend | `bu-nihon` | `vothanhan.dev`, optionally `www.vothanhan.dev` |
| API | `backend` | `api.vothanhan.dev` |

## API project

1. Create a managed PostgreSQL database (Vercel Postgres, Neon, Supabase, Railway, etc.). Docker Compose is for local development only.
2. Execute [`database/migrations/001_initial_auth.sql`](database/migrations/001_initial_auth.sql) once using the provider's SQL editor.
3. Add every variable from `.env.production.example` to the Vercel API project. Generate two long, different JWT secrets.
4. Point `api.vothanhan.dev` to this Vercel project. The Vercel function is in `api/[...path].ts`.

## Frontend project

1. Set `NEXT_PUBLIC_API_URL=https://api.vothanhan.dev/api` in Production environment variables.
2. Point `vothanhan.dev` to this Vercel project.

## External providers

- In Google Cloud, add `https://api.vothanhan.dev/api/auth/google/callback` as the authorized redirect URI.
- In Resend, verify `vothanhan.dev`, then use a sender such as `Bu Nihon <auth@vothanhan.dev>`.

For local development retain the values from `.env` and `.env.local`; PostgreSQL runs through `docker compose up`.
