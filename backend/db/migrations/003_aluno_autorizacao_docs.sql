-- Documentos de autorização dos responsáveis (obrigatório para alunos menores)

CREATE TABLE professor_aluno_documentos (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  professor_tema_aluno_id BIGINT NOT NULL,
  original_name VARCHAR(180) NOT NULL,
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
  UNIQUE KEY professor_aluno_documentos_storage_unique (storage_name),
  KEY professor_aluno_documentos_aluno_idx (professor_tema_aluno_id),
  CONSTRAINT professor_aluno_documentos_aluno_fk
    FOREIGN KEY (professor_tema_aluno_id) REFERENCES professor_tema_alunos(id) ON DELETE CASCADE
);
