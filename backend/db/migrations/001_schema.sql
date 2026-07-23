-- Schema SNCT conforme domínio de usuários / inscrição / check-in
-- Tabelas principais: roles, usuarios, checkins, auditoria
-- sessoes: login com cookie HttpOnly
-- Demais tabelas snct_*: conteúdo do portal (programação, editais, etc.)

CREATE TABLE roles (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(32) NOT NULL,
  nome VARCHAR(80) NOT NULL,
  UNIQUE KEY roles_codigo_unique (codigo)
);

INSERT INTO roles (codigo, nome) VALUES
  ('ADMINISTRADOR', 'Administrador'),
  ('STAFF', 'Staff'),
  ('AVALIADOR', 'Avaliador'),
  ('PROFESSOR', 'Professor'),
  ('VISITANTE', 'Visitante'),
  ('ALUNO', 'Aluno');

CREATE TABLE usuarios (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  nome_completo VARCHAR(180) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  cpf VARCHAR(11) NOT NULL,
  senha_hash TEXT NOT NULL,
  data_nascimento DATE NOT NULL,
  foto VARCHAR(500) NULL,
  aceitou_direito_imagem BOOLEAN NOT NULL DEFAULT FALSE,
  data_aceite_direito_imagem DATETIME(3) NULL,
  qr_code_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY usuarios_email_unique (email),
  UNIQUE KEY usuarios_cpf_unique (cpf),
  UNIQUE KEY usuarios_qr_code_hash_unique (qr_code_hash),
  KEY usuarios_role_id_idx (role_id),
  KEY usuarios_ativo_idx (ativo),
  CONSTRAINT usuarios_role_fk FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT usuarios_direito_imagem_check CHECK (
    aceitou_direito_imagem = FALSE
    OR data_aceite_direito_imagem IS NOT NULL
  )
);

CREATE TABLE checkins (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  data_checkin DATE NOT NULL,
  horario_checkin DATETIME(3) NOT NULL,
  realizado_por_usuario_id BIGINT NOT NULL,
  metodo VARCHAR(32) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY checkins_usuario_data_unique (usuario_id, data_checkin),
  KEY checkins_data_idx (data_checkin),
  CONSTRAINT checkins_metodo_check CHECK (
    metodo IN ('QRCODE', 'NOME', 'EMAIL', 'CPF', 'MANUAL')
  ),
  CONSTRAINT checkins_usuario_fk
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT checkins_realizado_por_fk
    FOREIGN KEY (realizado_por_usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE auditoria (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario_responsavel_id BIGINT NULL,
  acao VARCHAR(120) NOT NULL,
  entidade VARCHAR(80) NOT NULL,
  entidade_id VARCHAR(64) NULL,
  dados_anteriores JSON NULL,
  dados_novos JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY auditoria_created_at_idx (created_at),
  KEY auditoria_responsavel_idx (usuario_responsavel_id, created_at),
  CONSTRAINT auditoria_responsavel_fk
    FOREIGN KEY (usuario_responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE sessoes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  ip_hash VARCHAR(128) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY sessoes_token_hash_unique (token_hash),
  KEY sessoes_usuario_idx (usuario_id),
  KEY sessoes_expires_idx (expires_at),
  CONSTRAINT sessoes_usuario_fk
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE rate_limits (
  rate_key VARCHAR(255) NOT NULL PRIMARY KEY,
  request_count INT NOT NULL,
  window_started_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  KEY rate_limits_expiry_idx (expires_at)
);

-- Conteúdo do portal público (não faz parte do domínio de inscrição)
CREATE TABLE snct_events (
  id VARCHAR(64) PRIMARY KEY,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE snct_notices (
  id VARCHAR(64) PRIMARY KEY,
  title TEXT NOT NULL,
  registration TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT snct_notices_status_check CHECK (status IN ('aberto', 'encerrado'))
);

CREATE TABLE snct_notice_documents (
  id VARCHAR(64) PRIMARY KEY,
  notice_id VARCHAR(64) NULL,
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
  CONSTRAINT snct_notice_documents_notice_fk
    FOREIGN KEY (notice_id) REFERENCES snct_notices(id) ON DELETE CASCADE
);

CREATE TABLE snct_partners (
  id VARCHAR(64) PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
);

CREATE TABLE snct_site_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  event_edition VARCHAR(255) NOT NULL,
  hero_image_url VARCHAR(600) NOT NULL,
  privacy_version VARCHAR(64) NOT NULL DEFAULT '2026-07-20',
  retention_months INT NOT NULL DEFAULT 24,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT snct_site_settings_id_check CHECK (id = 1)
);
