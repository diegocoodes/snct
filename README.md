# SNCT Paulista 2026

Plataforma web da Semana Nacional de Ciência e Tecnologia — Paulista 2026. O projeto será desenvolvido de forma incremental para atender o site público, inscrições, credencial digital segura, área do participante, check-in por QR Code, entrega de brindes e administração do evento.

## Tecnologias

- Next.js 16 com App Router, React 19 e TypeScript
- Tailwind CSS 4 e shadcn/ui
- Inter para texto e Orbitron para destaques
- ESLint, Prettier e Vitest

## Requisitos

- Node.js 20.9 ou superior
- npm
- Git
- Codex CLI para a configuração dos MCPs de desenvolvimento

## Instalação local

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

O endereço padrão é `http://localhost:3000`.

## Variáveis de ambiente

Use `.env.example` como referência. Nunca envie arquivos `.env` ao repositório. A variável `API_KEY_21ST` não pertence ao `.env.example`; configure-a no ambiente de usuário do Windows:

```powershell
[Environment]::SetEnvironmentVariable("API_KEY_21ST", "SUA_CHAVE", "User")
```

Feche e reabra o VS Code depois da alteração. Nunca registre a chave real em documentação, código ou histórico Git.

## MCPs

Os servidores `shadcn` e `21st` estão configurados em `.vscode/mcp.json` e no Codex CLI. O `21st` só será autenticado depois que a variável `API_KEY_21ST` estiver disponível e o VS Code for reiniciado. Verifique o estado com:

```powershell
codex mcp list
```

Para recriar a configuração do shadcn:

```powershell
npx shadcn@latest mcp init --client vscode
codex mcp add shadcn -- npx shadcn@latest mcp
```

Para recriar a configuração do 21st no Codex sem gravar a chave em arquivo:

```powershell
codex mcp add 21st --url https://21st.dev/api/mcp --bearer-token-env-var API_KEY_21ST
```

## Scripts

```powershell
npm run dev
npm run lint
npm run typecheck
npm run test:run
npm run build
npm run format
npm run format:check
```

## Estrutura

- `src/app`: rotas e layouts do App Router
- `src/components`: componentes de UI e domínios do sistema
- `src/config`, `src/constants`: configuração estática e constantes
- `src/lib`, `src/services`: infraestrutura e serviços
- `src/validations`: schemas e regras de validação
- `src/emails`: templates de e-mail
- `prisma`: schema, migrations e seed do banco
- `public`: imagens e ativos públicos

## Estado atual

Etapa 1 concluída: inicialização, ferramentas de qualidade, estrutura base, fontes, tema e tokens. A Etapa 2 está parcialmente concluída, com os MCPs registrados e aguardando apenas a configuração segura da chave do 21st.dev para autenticação. Funcionalidades, autenticação, banco de dados, segurança, LGPD, testes de fluxo e Docker serão adicionados nas etapas seguintes e documentados conforme forem implementados.
