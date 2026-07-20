CREATE TABLE IF NOT EXISTS auth_users (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  role text NOT NULL DEFAULT 'visitor' CHECK (role IN ('visitor', 'staff', 'admin')),
  "twoFactorEnabled" boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS auth_users_email_lower_idx
  ON auth_users (lower(email));

CREATE TABLE IF NOT EXISTS auth_sessions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "expiresAt" timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
  ON auth_sessions ("userId");
CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx
  ON auth_sessions ("expiresAt");

CREATE TABLE IF NOT EXISTS auth_accounts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("providerId", "accountId")
);

CREATE INDEX IF NOT EXISTS auth_accounts_user_id_idx
  ON auth_accounts ("userId");

CREATE TABLE IF NOT EXISTS auth_verifications (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_verifications_identifier_idx
  ON auth_verifications (identifier);
CREATE INDEX IF NOT EXISTS auth_verifications_expires_at_idx
  ON auth_verifications ("expiresAt");

CREATE TABLE IF NOT EXISTS auth_two_factors (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  secret text NOT NULL,
  "backupCodes" text NOT NULL,
  "userId" text NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  verified boolean NOT NULL DEFAULT true,
  "failedVerificationCount" integer NOT NULL DEFAULT 0,
  "lockedUntil" timestamptz
);

CREATE INDEX IF NOT EXISTS auth_two_factors_secret_idx
  ON auth_two_factors (secret);
CREATE INDEX IF NOT EXISTS auth_two_factors_user_id_idx
  ON auth_two_factors ("userId");

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key text NOT NULL UNIQUE,
  count integer NOT NULL,
  "lastRequest" bigint NOT NULL
);
