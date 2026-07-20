# Design system — SNCT Paulista 2026

O sistema visual traduz ciência, tecnologia e inovação com uma linguagem institucional: superfícies profundas, alto contraste, gradientes controlados e movimento discreto. Os tokens centrais vivem em `src/app/globals.css` e as primitivas reutilizáveis em `src/components/ui`.

## Fundamentos

### Tipografia

- **Poppins:** títulos, assinaturas, métricas e ações de maior destaque.
- **Montserrat:** conteúdo, navegação, formulários e dados operacionais.
- A escala é fluida e usa limites responsivos para preservar leitura sem cortes ou overflow horizontal.

### Cores e superfícies

- Roxo profundo forma a base institucional do portal.
- Ciano identifica ações, foco, links e informações.
- Magenta é reservado a glows e detalhes de destaque.
- Branco gelo é usado no conteúdo principal; tons lavanda mantêm os textos secundários legíveis.
- Estados de sucesso, alerta e erro combinam texto, ícone e cor — nunca somente cor.

### Movimento

- O background da hero usa `MeshGradient`, com ciano, roxo e magenta em baixa intensidade.
- Entradas, carrosséis, partículas e flutuação têm duração curta ou ritmo lento, sem aparência de jogo.
- As animações decorativas são desativadas ou reduzidas quando o sistema informa `prefers-reduced-motion: reduce`.

## Componentes

As primitivas incluem accordion, alert, badge, button, calendar, card, carousel, checkbox, dialog, drawer, field, input, label, pagination, popover, radio-group, select, separator, sheet, skeleton, switch, table, tabs, textarea, toast e tooltip.

Os compostos do produto incluem:

- `DataTable`, `FilterBar`, `SearchInput` e `Pagination` para gestão de dados.
- `FormField`, `FormStep`, `InputMask` e `DatePicker` para entrada consistente.
- `MetricCard`, `StatusBadge` e `StatePanel` para feedback operacional.
- `NewsCarousel`, `PartnersMarquee`, `HighlightsSection` e `HeroSection` para a experiência pública.
- `AdminDashboard`, `StaffScanner` e `VisitorPass` para as jornadas autenticadas.

## Responsividade

- **Desktop:** navegação completa e layouts em duas colunas quando há ganho de leitura.
- **Tablet:** tipografia, espaçamento e elementos visuais reduzidos de forma progressiva.
- **Mobile:** conteúdo em uma coluna, botões com largura total e navegação em `Sheet` lateral.
- Containers, imagens e textos usam limites explícitos para impedir overflow horizontal.

## Acessibilidade

- Foco visível em todos os controles interativos.
- Áreas clicáveis confortáveis para toque.
- Contraste entre texto, controles e superfícies escuras.
- `aria-label` em botões compostos apenas por ícone.
- Rótulos associados aos campos e mensagens de erro identificáveis.
- Diálogos com título e descrição da consequência da ação.
- HTML semântico e navegação possível por teclado.
- Estados comunicados por texto e indicadores visuais, sem depender exclusivamente da cor.

## Uso da marca

O ativo principal está em `public/images/cienciasemfundo.png`. A logomarca é apresentada sem card externo, com espaço de respiro próprio e efeitos posicionados atrás dela. Alterações da imagem da hero podem ser feitas no painel administrativo sem modificar o código.
