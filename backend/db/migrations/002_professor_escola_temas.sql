-- Escola, temas e alunos gerenciados pelo professor

CREATE TABLE professor_escolas (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  professor_usuario_id BIGINT NOT NULL,
  nome VARCHAR(180) NOT NULL,
  cidade VARCHAR(120) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY professor_escolas_professor_unique (professor_usuario_id),
  CONSTRAINT professor_escolas_professor_fk
    FOREIGN KEY (professor_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE professor_temas (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  escola_id BIGINT NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  descricao VARCHAR(500) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY professor_temas_escola_idx (escola_id),
  CONSTRAINT professor_temas_escola_fk
    FOREIGN KEY (escola_id) REFERENCES professor_escolas(id) ON DELETE CASCADE
);

CREATE TABLE professor_tema_alunos (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tema_id BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL,
  nome_completo VARCHAR(180) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY professor_tema_alunos_usuario_unique (usuario_id),
  KEY professor_tema_alunos_tema_idx (tema_id),
  CONSTRAINT professor_tema_alunos_tema_fk
    FOREIGN KEY (tema_id) REFERENCES professor_temas(id) ON DELETE CASCADE,
  CONSTRAINT professor_tema_alunos_usuario_fk
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);
