<div align="center">
  <img src="./docs/assets/cienciasemfundo.png" width="230" alt="Logotipo Ciência e Tecnologia" />

# SNCT Paulista 2026

**Portal seguro da Semana Nacional de Ciência e Tecnologia do Paulista — ciência, inovação e comunidade em uma experiência digital acessível.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-111827?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-0ea5e9?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Better Auth](https://img.shields.io/badge/Auth-MFA_%2B_RBAC-7c3aed)](https://www.better-auth.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)](https://www.typescriptlang.org/)
</div>

<p align="center">
  <img src="./docs/assets/home-desktop.png" alt="Página inicial do portal SNCT Paulista 2026" width="100%" />
</p>

## Sobre o projeto

O SNCT Paulista 2026 reúne a presença pública e a operação do evento em uma aplicação. O portal apresenta notícias oficiais, programação, editais, parceiros e localização; visitantes criam uma credencial QR; equipes fazem check-in e registram brindes; administradores mantêm o conteúdo sem editar código.

## Principais recursos

- Portal público responsivo com hero animada, notícias, editais, agenda, mapa, parceiros e FAQ.
- Notícias obtidas pela API WordPress oficial da [Prefeitura do Paulista](https://paulista.pe.gov.br/).
- Autenticação PostgreSQL com sessões revogáveis, verificação de e-mail e recuperação de senha.
- MFA TOTP obrigatório para equipe e administradores, com códigos de recuperação e bloqueio de tentativas.
- Credencial individual com QR Code rotacionável, revogável e com validade.
- Scanner protegido para check-in e controle idempotente de entrega de brindes.
- Painel no-code com auditoria para usuários, programação, editais, anexos, parceiros e hero.
- Anexos validados por conteúdo, analisados pelo ClamAV e criptografados com AES-256-GCM.
- Direitos LGPD: aviso de privacidade, consentimento, exportação e solicitação de exclusão.
- CSP com nonce, headers de segurança, proteção CSRF/origin e rate limiting persistente.

### Responsivo por padrão

<p align="center">
  <img src="./docs/assets/home-mobile.png" width="320" alt="Hero do portal SNCT em um dispositivo móvel" />
</p>

## Arquitetura

```mermaid
flowchart LR
    U[Visitante / Equipe / Admin] --> PX[Next.js Proxy<br/>CSP + headers]
    PX --> APP[Next.js App Router]
    APP --> AUTH[Better Auth<br/>MFA + sessões + e-mail]
    APP --> API[Route Handlers<br/>RBAC + CSRF + rate limit]
    APP --> NEWS[WordPress oficial]
    APP --> MAP[Google Maps]
    AUTH --> PG[(PostgreSQL)]
    API --> PG
    API --> AV[ClamAV]
    AUTH --> SMTP[SMTP]
```

Server Components compõem as páginas e consultam o PostgreSQL diretamente. Componentes de cliente usam Route Handlers como fronteira para mutações. Toda autorização sensível é repetida no servidor. Consulte a [arquitetura detalhada](frontend/docs/architecture.md).

## Perfis

| Perfil        | Capacidades                                                             |
| ------------- | ----------------------------------------------------------------------- |
| Público       | Notícias, programação, editais, parceiros, localização e FAQ            |
| Visitante     | Cadastro verificado, credencial QR, exportação e exclusão de dados      |
| Equipe        | MFA obrigatório, scanner, check-in e registro de brindes                |
| Administrador | MFA obrigatório, painel no-code, usuários, conteúdo, anexos e auditoria |

## Stack

- **Aplicação:** Next.js 16, React 19 e TypeScript.
- **Interface:** Tailwind CSS 4, shadcn/ui, Base UI e Lucide React.
- **Autenticação:** Better Auth, Argon2id, MFA TOTP e sessões em banco.
- **Dados:** PostgreSQL e migrações SQL explícitas.
- **Arquivos:** PostgreSQL `bytea`, AES-256-GCM, detecção de assinatura e ClamAV.
- **E-mail:** SMTP com Nodemailer.
- **Qualidade:** ESLint, Prettier, Vitest, npm audit, Dependabot e CodeQL.

## Estrutura

```text
frontend/                 # Aplicação Next.js (UI + Route Handlers)
├── src/                  # Páginas, componentes, lib e APIs
├── public/               # Assets estáticos
├── scripts/              # Loader de env do backend + validação de produção
├── docs/                 # Arquitetura, segurança, implantação e operação
└── .env                  # Variáveis públicas (NEXT_PUBLIC_*)

backend/                  # API Express (Node) + migrações
├── src/                  # Servidor Express e libs de domínio
├── db/migrations/        # Esquema PostgreSQL versionado
├── scripts/              # Migração e retenção
└── .env                  # Segredos e variáveis de servidor / banco
```

## Executando localmente

Requisitos: Node.js 20.9+, npm e **MySQL** instalado na máquina (usuário `root`, senha conforme seu `.env`).

1. Crie o banco (o script de migração também cria se não existir):

```sql
CREATE DATABASE IF NOT EXISTS snct CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Backend (Express na porta 4001):

```powershell
Set-Location snct\backend
Copy-Item .env.example .env
# DATABASE_URL=mysql://root:12345@127.0.0.1:3306/snct
npm install
npm run db:migrate
npm run dev
```

3. Frontend (outro terminal):

```powershell
Set-Location snct\frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Acesse `http://localhost:4000`. O frontend encaminha `/api/*` para o Express em `http://localhost:4001`.

## Variáveis essenciais

### `frontend/.env`

| Variável                      | Finalidade                        |
| ----------------------------- | --------------------------------- |
| `NEXT_PUBLIC_PRIVACY_CONTACT` | Canal do encarregado/controlador  |

### `backend/.env`

| Variável                                   | Finalidade                                     |
| ------------------------------------------ | ---------------------------------------------- |
| `PORT`                                     | Porta do Express (padrão `4001`)               |
| `DATABASE_URL`                             | Conexão MySQL (ex.: `mysql://root:12345@127.0.0.1:3306/snct`) |
| `BETTER_AUTH_URL`                          | URL do portal (ex.: `http://localhost:4000`)   |
| `BETTER_AUTH_SECRET`                       | Criptografia e assinatura do Better Auth       |
| `SNCT_RATE_LIMIT_SECRET`                   | HMAC de IPs e identificadores dos limitadores  |
| `SNCT_DATA_ENCRYPTION_KEYS`                | Chaves versionadas AES-256-GCM para anexos     |
| `SNCT_ADMIN_EMAIL` / `SNCT_ADMIN_PASSWORD` | Bootstrap único do administrador               |
| `SNCT_SMTP_*` / `SNCT_EMAIL_FROM`          | Verificação, recuperação e exclusão por e-mail |
| `CLAMAV_HOST` / `CLAMAV_PORT`              | Antivírus (opcional em dev; obrigatório em prod) |

Os scripts do frontend (`dev`, `build`, `start`, `security:check-env`) carregam automaticamente `backend/.env` além de `frontend/.env`.

Use `frontend/.env.example` e `backend/.env.example` como referência. Nunca envie `.env`, dumps, chaves ou credenciais ao Git. O administrador configurado no ambiente é criado no PostgreSQL no primeiro login, com senha convertida para Argon2id.

## Comandos

```powershell
# Frontend
Set-Location frontend
npm run dev                # desenvolvimento (http://localhost:4000)
npm run build              # build de produção
npm run start              # executa o build
npm run security:check-env # valida configuração de produção
npm run security:audit     # vulnerabilidades das dependências de produção
npm run lint
npm run typecheck
npm run test:run
npm run format:check

# Backend
Set-Location backend
npm run dev                # API Express (http://localhost:4001)
npm run db:migrate         # aplica migrações SQL com checksum
npm run db:cleanup         # aplica a política de retenção
```

## Segurança

O sistema aplica defesa em profundidade: Argon2id, MFA, sessão revogável, autorização server-side, proteção de origem, rate limiting, CSP, criptografia de anexos, antivírus, auditoria e automação de dependências. Isso reduz riscos, mas não substitui TLS, firewall/WAF, backups, monitoramento, revisão de infraestrutura e teste de intrusão antes do evento.

Consulte o [modelo de ameaças e checklist de segurança](frontend/docs/security.md) e o [guia de implantação](frontend/docs/deployment.md).

## Documentação

- [Arquitetura e fluxos](frontend/docs/architecture.md)
- [Segurança e resposta a incidentes](frontend/docs/security.md)
- [Implantação PostgreSQL](frontend/docs/deployment.md)
- [Guia do painel administrativo](frontend/docs/administration.md)
- [Design system e acessibilidade](frontend/docs/design-system.md)

---

<div align="center">
  Desenvolvido para a Semana Nacional de Ciência e Tecnologia do Paulista 2026.
</div>
