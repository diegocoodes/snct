# Guia de administração

## Acesso

Configure `SNCT_ADMIN_EMAIL` e `SNCT_ADMIN_PASSWORD` no ambiente, inicie a aplicação e abra `/login`. Selecione o perfil de administrador e use essas credenciais. A sessão expira em oito horas.

As credenciais iniciais não são gravadas no store nem devem ser incluídas em arquivos versionados.

## Visão do painel

O painel foi desenhado para atualização no-code e agrupa as rotinas operacionais:

- **Visão geral:** indicadores dos dados cadastrados.
- **Usuários:** criação de visitante ou membro da equipe e remoção de contas.
- **Programação:** criação, edição e exclusão de atividades, horários e locais.
- **Editais:** título, período de inscrição, status e anexos.
- **Parceiros:** nome e URL pública da logomarca.
- **Portal:** edição da assinatura do evento e imagem principal da hero.

## Editais e documentos

1. Informe um título claro e o período de inscrições.
2. Selecione o estado `aberto` ou `encerrado`.
3. Anexe, quando necessário, um arquivo permitido.
4. Salve o edital; novos anexos são adicionados aos já existentes.

Formatos aceitos: PDF, DOC, DOCX, ODT, XLS e XLSX. O limite é 10 MB por arquivo. Ao excluir um documento ou edital, o arquivo correspondente também é removido do armazenamento local.

## Usuários e operação do evento

- Visitantes criados no painel recebem uma credencial da mesma forma que os cadastrados pelo portal.
- Contas de equipe acessam o scanner em `/perfil`.
- A equipe deve confirmar o check-in antes de registrar a entrega do brinde.
- O sistema mantém o primeiro horário de cada operação para impedir duplicidade acidental.

## Conteúdo público

- Alterações na programação e nos editais alimentam as áreas públicas correspondentes.
- Parceiros aparecem na faixa animada da página inicial.
- A imagem da hero aceita caminho público local, como `/images/cienciasemfundo.png`, ou URL `http/https` válida.
- As notícias não são cadastradas no painel: elas vêm automaticamente do portal oficial da Prefeitura do Paulista.

## Backup e restauração

Em desenvolvimento, faça backup conjunto de:

- `.data/snct-store.json`
- `.data/uploads/`

Os dois itens são ignorados pelo Git e não são enviados ao GitHub. Para restaurar, interrompa a aplicação, recoloque o JSON e a pasta de uploads na mesma estrutura e reinicie o servidor.

## Checklist antes da publicação

- Migrar JSON e uploads para serviços persistentes compatíveis com a hospedagem.
- Gerar segredo de sessão longo e exclusivo.
- Usar senha administrativa forte e armazenada no cofre do provedor.
- Configurar domínio, HTTPS, backup e observabilidade.
- Testar cadastro, login, QR Code, check-in, brinde, editais e downloads.
- Revisar textos, datas, links, acessibilidade e política de privacidade/LGPD.
