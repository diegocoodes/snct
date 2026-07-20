# Segurança

## Controles implementados

### Identidade

- Better Auth com sessões persistidas e revogáveis no PostgreSQL.
- Senhas com Argon2id: 19 MiB, duas iterações e paralelismo 1.
- Mínimo de 12 caracteres com quatro classes de caracteres.
- MFA TOTP obrigatório para equipe e administradores.
- Cinco falhas de segundo fator bloqueiam a conta por 15 minutos.
- Códigos de recuperação criptografados e uso único.
- Verificação de e-mail em produção e recuperação com tokens expirantes.

### Aplicação

- Autorização por perfil repetida em cada Route Handler sensível.
- Proteção de origem, Fetch Metadata e cabeçalho anti-CSRF em mutações próprias.
- Rate limiting persistente por escopo, IP hasheado e identidade.
- CSP com nonce, HSTS, `nosniff`, proteção contra framing e política de permissões.
- URLs administráveis limitadas a HTTPS e hosts autorizados.
- Erros externos genéricos, sem stack trace ou detalhes internos.

### Dados e arquivos

- PostgreSQL como fonte de verdade; nenhuma persistência em filesystem local.
- Anexos fora do diretório público, validados por assinatura e ClamAV.
- AES-256-GCM com nonce aleatório e chave versionada.
- QR sem nome/e-mail, com rotação, expiração e revogação.
- Exportação e exclusão de dados pelo titular.
- Retenção automatizada de perfis, sessões, tokens e logs.

### Detecção

- Auditoria de login, administração, credenciais, arquivos e solicitações LGPD.
- IP registrado somente como HMAC, nunca em texto aberto.
- Dependabot semanal, CodeQL e `npm audit` no CI.

## Modelo de ameaças resumido

| Ameaça                          | Controle principal                                                         |
| ------------------------------- | -------------------------------------------------------------------------- |
| Força bruta/credential stuffing | Rate limit, Argon2id, MFA e bloqueio                                       |
| Roubo de sessão                 | Cookie HttpOnly/Secure, expiração, banco e revogação                       |
| CSRF                            | Origin, Fetch Metadata, cabeçalho customizado e proteção Better Auth       |
| XSS                             | React escaping, CSP com nonce, allowlists e ausência de HTML administrável |
| Escalada de privilégio          | `role` server-owned e autorização em cada endpoint                         |
| Upload malicioso                | assinatura, tamanho, ClamAV, criptografia e download sandbox               |
| Vazamento de QR                 | token aleatório, rotação, revogação e validade                             |
| Abuso administrativo            | MFA, auditoria, rate limit e proteção contra excluir admin                 |
| Perda de dados                  | PostgreSQL, backup cifrado e restauração testada                           |

## Gestão de chaves

`SNCT_DATA_ENCRYPTION_KEYS` aceita uma lista `versão:base64`. A maior versão criptografa novos documentos; versões anteriores continuam descriptografando arquivos existentes. Para rotacionar:

1. Gere 32 bytes aleatórios.
2. Acrescente uma versão maior antes das antigas.
3. Implante e confirme downloads.
4. Recriptografe documentos antigos em tarefa controlada.
5. Remova a chave antiga somente depois da migração e do backup.

Segredos ficam no cofre do provedor e nunca em arquivos, logs, screenshots ou GitHub Actions. A chave do 21st.dev usada no desenvolvimento não pertence ao runtime do portal.

## Operação

- Em `frontend/`, execute `npm run security:audit` em cada entrega.
- Em `frontend/`, execute `npm run security:check-env` antes de promover para produção.
- Em `backend/`, agende `npm run db:cleanup` diariamente.
- Centralize logs, crie alertas para falhas repetidas e proteja o acesso à auditoria.
- Use TLS, WAF/CDN, rede privada para PostgreSQL/ClamAV e princípio do menor privilégio.
- Teste restauração de backup e resposta a incidentes antes do evento.

## Resposta a incidentes

1. Revogue sessões e credenciais afetadas.
2. Rotacione segredos e chaves comprometidas mantendo versões necessárias à recuperação.
3. Preserve logs e evidências em armazenamento imutável.
4. Identifique titulares e dados afetados.
5. Corrija, teste e monitore a causa raiz.
6. Acione responsáveis jurídicos e o encarregado para avaliar comunicações aplicáveis.

## Limites

Nenhum código garante segurança sozinho. A proteção final depende da hospedagem, configuração de rede, gestão de pessoas, revisão LGPD, backups e testes de intrusão independentes. Use o OWASP ASVS como checklist de homologação.
