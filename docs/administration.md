# Guia de administração

## Primeiro acesso

1. Configure `SNCT_ADMIN_EMAIL` e uma senha forte em `SNCT_ADMIN_PASSWORD`.
2. Execute `npm run db:migrate`.
3. Abra `/login` e informe as credenciais.
4. No primeiro acesso, a conta é criada no PostgreSQL e a senha é convertida em Argon2id.
5. Cadastre imediatamente o MFA TOTP e salve os códigos de recuperação fora do computador.

Depois do bootstrap, alterar a senha no ambiente não substitui o hash do banco. Use o fluxo seguro de recuperação. Nunca compartilhe uma conta administrativa entre pessoas.

## Painel no-code

- **Portal:** assinatura da edição e imagem principal autorizada.
- **Usuários:** visitantes/equipe, e-mail verificado e estado do MFA.
- **Programação:** atividades, horários e locais.
- **Editais:** período, status e documentos.
- **Parceiros:** nome e URL HTTPS de host autorizado.
- **Auditoria:** últimas ações sensíveis e resultados.

## Usuários

Contas criadas pelo administrador recebem e-mail verificado. Membros da equipe não acessam o scanner até ativar MFA. Senhas temporárias devem ter pelo menos 12 caracteres com maiúscula, minúscula, número e símbolo; transmita-as por canal separado e oriente a redefinição.

O painel não permite excluir a conta administrativa inicial. Exclusões de outros usuários revogam sessões e removem conta, MFA e perfil por cascata.

## Editais e anexos

Formatos: PDF, DOC, DOCX, ODT, XLS e XLSX, até 10 MB.

O servidor compara assinatura e extensão, consulta o ClamAV, calcula SHA-256, criptografa com AES-256-GCM e só então grava no PostgreSQL. Em produção, falha do antivírus ou ausência da chave bloqueia o upload. Documentos são baixados como anexo em contexto sandbox.

## Operação do evento

- O visitante pode renovar o QR; a versão anterior deixa de funcionar.
- QR expirado ou revogado é bloqueado e auditado.
- Check-in e brinde registram somente a primeira ocorrência.
- Brinde exige check-in anterior.
- Falhas repetidas no scanner acionam rate limiting.

## Auditoria

Revise a aba de auditoria durante a operação. Investigue:

- Falhas e bloqueios repetidos.
- Alterações administrativas fora da janela prevista.
- Tentativas com QR inexistente, expirado ou revogado.
- Exclusões de usuários e documentos.
- Solicitações de exportação e exclusão.

Endereços são hasheados; senhas, tokens, QR e conteúdo de documentos nunca entram nos metadados de auditoria.

## LGPD

O visitante pode exportar os próprios dados e iniciar exclusão pelo perfil. Solicitações recebem protocolo no banco. Cadastros de menores exigem confirmação de ciência do responsável e devem sempre observar o melhor interesse do menor.

O controlador deve definir contato do encarregado, base legal, retenção final e procedimento humano para correção, contestação ou exceções legais. A implementação técnica não substitui essa governança.

## Rotinas

- Diário: `npm run db:cleanup` e revisão de alertas.
- Semanal: vulnerabilidades, contas de equipe e falhas de autenticação.
- Antes do evento: backup/restauração, scanner, e-mail, MFA e teste de carga.
- Depois do evento: revisar retenção, revogar contas temporárias e preservar somente o necessário.
