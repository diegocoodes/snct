CREATE TABLE IF NOT EXISTS snct_profiles (
  user_id VARCHAR(191) PRIMARY KEY,
  age SMALLINT NULL,
  visitor_hash VARCHAR(255) NULL,
  checked_in_at DATETIME(3) NULL,
  gift_delivered_at DATETIME(3) NULL,
  privacy_accepted_at DATETIME(3) NULL,
  privacy_version VARCHAR(64) NULL,
  guardian_consent_at DATETIME(3) NULL,
  qr_expires_at DATETIME(3) NULL,
  qr_revoked_at DATETIME(3) NULL,
  retention_expires_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3) + INTERVAL 2 YEAR),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY snct_profiles_visitor_hash_unique (visitor_hash),
  KEY snct_profiles_retention_idx (retention_expires_at),
  CONSTRAINT snct_profiles_age_check CHECK (age IS NULL OR (age BETWEEN 5 AND 120)),
  CONSTRAINT snct_profiles_user_fk
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS snct_events (
  id VARCHAR(191) PRIMARY KEY,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS snct_notices (
  id VARCHAR(191) PRIMARY KEY,
  title TEXT NOT NULL,
  registration TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT snct_notices_status_check CHECK (status IN ('aberto', 'encerrado'))
);

CREATE TABLE IF NOT EXISTS snct_notice_documents (
  id VARCHAR(191) PRIMARY KEY,
  notice_id VARCHAR(191) NULL,
  original_name TEXT NOT NULL,
  storage_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  byte_size INT NOT NULL,
  sha256 VARCHAR(128) NOT NULL,
  scan_status VARCHAR(32) NOT NULL DEFAULT 'clean',
  encryption_iv BLOB NOT NULL,
  encryption_tag BLOB NOT NULL,
  encryption_key_version INT NOT NULL,
  file_data LONGBLOB NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY snct_notice_documents_storage_unique (storage_name),
  KEY snct_notice_documents_notice_idx (notice_id),
  CONSTRAINT snct_notice_documents_size_check CHECK (byte_size BETWEEN 1 AND 10485760),
  CONSTRAINT snct_notice_documents_scan_check CHECK (scan_status IN ('pending', 'clean', 'infected', 'error')),
  CONSTRAINT snct_notice_documents_notice_fk
    FOREIGN KEY (notice_id) REFERENCES snct_notices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS snct_partners (
  id VARCHAR(191) PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS snct_site_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  event_edition VARCHAR(255) NOT NULL,
  hero_image_url VARCHAR(600) NOT NULL,
  privacy_version VARCHAR(64) NOT NULL DEFAULT '2026-07-20',
  retention_months INT NOT NULL DEFAULT 24,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT snct_site_settings_id_check CHECK (id = 1),
  CONSTRAINT snct_site_settings_retention_check CHECK (retention_months BETWEEN 1 AND 120)
);

CREATE TABLE IF NOT EXISTS snct_rate_limits (
  rate_key VARCHAR(255) PRIMARY KEY,
  request_count INT NOT NULL,
  window_started_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  KEY snct_rate_limits_expiry_idx (expires_at)
);

CREATE TABLE IF NOT EXISTS snct_audit_logs (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id VARCHAR(191) NULL,
  actor_role VARCHAR(32) NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id VARCHAR(191) NULL,
  outcome VARCHAR(32) NOT NULL DEFAULT 'success',
  ip_hash VARCHAR(128) NOT NULL,
  metadata JSON NOT NULL DEFAULT (JSON_OBJECT()),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY snct_audit_logs_created_at_idx (created_at),
  KEY snct_audit_logs_actor_idx (actor_id, created_at),
  CONSTRAINT snct_audit_logs_role_check CHECK (
    actor_role IS NULL OR actor_role IN ('visitor', 'staff', 'admin')
  ),
  CONSTRAINT snct_audit_logs_outcome_check CHECK (
    outcome IN ('success', 'failure', 'blocked')
  )
);

CREATE TABLE IF NOT EXISTS snct_privacy_requests (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NULL,
  request_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'completed',
  protocol VARCHAR(64) NOT NULL,
  details JSON NOT NULL DEFAULT (JSON_OBJECT()),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  completed_at DATETIME(3) NULL,
  UNIQUE KEY snct_privacy_requests_protocol_unique (protocol),
  KEY snct_privacy_requests_user_idx (user_id, created_at),
  CONSTRAINT snct_privacy_requests_type_check CHECK (
    request_type IN ('access', 'correction', 'deletion', 'revocation')
  ),
  CONSTRAINT snct_privacy_requests_status_check CHECK (
    status IN ('pending', 'processing', 'completed', 'rejected')
  )
);
