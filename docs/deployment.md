# Implantação segura

## Dependências

- Node.js LTS compatível com Next.js 16.
- PostgreSQL 17 ou serviço gerenciado equivalente.
- ClamAV acessível apenas pela rede privada.
- SMTP transacional com SPF, DKIM e DMARC configurados.
- Proxy/CDN com TLS, WAF e rate limiting adicional.

## Preparação

1. Crie banco e usuário exclusivos para o portal.
2. Restrinja a origem de rede que pode acessar o PostgreSQL e o ClamAV.
3. Configure todas as variáveis de `.env.example` no cofre do provedor.
4. Use três segredos independentes: Better Auth, rate limiting e criptografia de arquivos.
5. Defina `BETTER_AUTH_URL` e `SNCT_TRUSTED_ORIGINS` somente com URLs HTTPS oficiais.
6. Defina o contato real de privacidade antes de abrir inscrições.

Valide a configuração:

```powershell
npm run security:check-env
```

## Banco

Execute as migrações como uma etapa única antes de iniciar as novas instâncias:

```powershell
npm run db:migrate
```

O runner usa advisory lock e registra checksum em `snct_migrations`. Nunca altere uma migração aplicada; crie outro arquivo SQL numerado.

O usuário de migração pode ter privilégios de DDL. O usuário usado pela aplicação deve ter somente `SELECT`, `INSERT`, `UPDATE` e `DELETE` nas tabelas e uso das sequences necessárias.

## Processo de release

```powershell
npm ci
npm run security:audit
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run db:migrate
npm run start
```

Use implantação gradual e mantenha uma versão anterior disponível para rollback. Migrações devem ser compatíveis com a versão anterior durante a janela de troca.

## Backup

- Backup PostgreSQL automático, cifrado e em região/conta separada.
- Política com cópias diárias e retenção alinhada ao controlador.
- Teste periódico de restauração em ambiente isolado.
- Backup das chaves em cofre separado; sem elas, anexos criptografados não podem ser recuperados.
- Não copie produção para desenvolvimento sem anonimização.

## Jobs programados

Execute diariamente:

```powershell
npm run db:cleanup
```

A tarefa remove sessões e verificações expiradas, cadastros não confirmados, anexos órfãos, visitantes além da retenção e auditoria antiga.

## Monitoramento

Monitore disponibilidade, latência, erros 5xx, bloqueios 429, falhas de login/MFA, rejeições do antivírus, tamanho do banco, conexões, tempo de consulta, falhas SMTP e expiração de certificados.

Alertas críticos devem chegar a um canal operacional acompanhado. Logs não podem conter senhas, cookies, tokens, códigos TOTP, chaves ou conteúdo completo de documentos.

## Checklist de liberação

- [ ] DNS e HTTPS ativos; HSTS conferido.
- [ ] PostgreSQL e ClamAV inacessíveis pela internet pública.
- [ ] Migrações e restauração de backup testadas.
- [ ] MFA configurado por todos os administradores e membros da equipe.
- [ ] SMTP, verificação, recuperação e exclusão testados.
- [ ] Upload limpo e arquivo EICAR bloqueado em homologação.
- [ ] CSP verificada no navegador sem violações inesperadas.
- [ ] Rate limits testados atrás do proxy real.
- [ ] Contato e aviso de privacidade aprovados pelo controlador.
- [ ] Teste de intrusão e revisão de permissões concluídos.
