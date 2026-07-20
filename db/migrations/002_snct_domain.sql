CREATE TABLE IF NOT EXISTS snct_profiles (
  user_id text PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  age smallint CHECK (age BETWEEN 5 AND 120),
  visitor_hash text UNIQUE,
  checked_in_at timestamptz,
  gift_delivered_at timestamptz,
  privacy_accepted_at timestamptz,
  privacy_version text,
  guardian_consent_at timestamptz,
  qr_expires_at timestamptz,
  qr_revoked_at timestamptz,
  retention_expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 years'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snct_profiles_visitor_hash_idx
  ON snct_profiles (visitor_hash) WHERE visitor_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS snct_profiles_retention_idx
  ON snct_profiles (retention_expires_at);

CREATE TABLE IF NOT EXISTS snct_events (
  id text PRIMARY KEY,
  event_date text NOT NULL,
  event_time text NOT NULL,
  title text NOT NULL,
  location text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS snct_notices (
  id text PRIMARY KEY,
  title text NOT NULL,
  registration text NOT NULL,
  status text NOT NULL CHECK (status IN ('aberto', 'encerrado')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS snct_notice_documents (
  id text PRIMARY KEY,
  notice_id text REFERENCES snct_notices(id) ON DELETE CASCADE,
  original_name text NOT NULL,
  storage_name text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  byte_size integer NOT NULL CHECK (byte_size BETWEEN 1 AND 10485760),
  sha256 text NOT NULL,
  scan_status text NOT NULL DEFAULT 'clean' CHECK (scan_status IN ('pending', 'clean', 'infected', 'error')),
  encryption_iv bytea NOT NULL,
  encryption_tag bytea NOT NULL,
  encryption_key_version integer NOT NULL,
  file_data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snct_notice_documents_notice_idx
  ON snct_notice_documents (notice_id);

CREATE TABLE IF NOT EXISTS snct_partners (
  id text PRIMARY KEY,
  name text NOT NULL,
  logo text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS snct_site_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  event_edition text NOT NULL,
  hero_image_url text NOT NULL,
  privacy_version text NOT NULL DEFAULT '2026-07-20',
  retention_months integer NOT NULL DEFAULT 24 CHECK (retention_months BETWEEN 1 AND 120),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS snct_rate_limits (
  rate_key text PRIMARY KEY,
  request_count integer NOT NULL,
  window_started_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS snct_rate_limits_expiry_idx
  ON snct_rate_limits (expires_at);

CREATE TABLE IF NOT EXISTS snct_audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id text,
  actor_role text CHECK (actor_role IS NULL OR actor_role IN ('visitor', 'staff', 'admin')),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  outcome text NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'failure', 'blocked')),
  ip_hash text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snct_audit_logs_created_at_idx
  ON snct_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS snct_audit_logs_actor_idx
  ON snct_audit_logs (actor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS snct_privacy_requests (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text,
  request_type text NOT NULL CHECK (request_type IN ('access', 'correction', 'deletion', 'revocation')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  protocol text NOT NULL UNIQUE,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS snct_privacy_requests_user_idx
  ON snct_privacy_requests (user_id, created_at DESC);
