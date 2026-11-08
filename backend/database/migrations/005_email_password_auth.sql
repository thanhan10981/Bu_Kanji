-- Keep historical migrations immutable. Refuse ambiguous ownership rather than merge accounts.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM users GROUP BY lower(btrim(email)) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Canonical duplicate emails require manual resolution before migration';
  END IF;
  IF EXISTS (
    SELECT 1 FROM auth_identities i JOIN users u ON u.id = i."userId"
    WHERE i.provider = 'password' AND lower(btrim(i."providerAccountId")) <> lower(btrim(u.email))
  ) THEN
    RAISE EXCEPTION 'Inconsistent password identity requires manual resolution before migration';
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_email_normalized" ON users (lower(btrim(email)));
CREATE TABLE IF NOT EXISTS auth_login_limits (
  "scopeKey" text PRIMARY KEY,
  attempts integer NOT NULL CHECK (attempts >= 1),
  "windowStartedAt" timestamptz NOT NULL,
  "expiresAt" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_auth_login_limits_expiry" ON auth_login_limits ("expiresAt");
