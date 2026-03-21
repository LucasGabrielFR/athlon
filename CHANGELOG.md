# Changelog

Todas as mudanças notáveis para o projeto **Athlon** serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [0.6.4] - 2026-03-21
### Added
- **Configuração Avançada de Classificação**: Agora é possível definir pontuação customizada para Vitória, Empate e Derrota tanto na criação quanto na edição.
- **Hierarquia de Desempate Drag-and-Drop**: Implementado seletor visual premium para definir a prioridade dos critérios de desempate (Pontos, Vitórias, Saldo, Gols Pró).
- **Visibilidade Inteligente de Abas**: A aba "Classificação" em detalhes da competição agora é ocultada automaticamente para torneios de formato Mata-mata puro.
- **Segurança e Integridade na Exclusão**: Reformulada a exclusão de competições para garantir que apenas Admins possam excluir torneios em andamento, com limpeza manual garantida de todos os dados relacionados (Partidas, Eventos, Elencos e Registros).
- **Sistema de Validação de Partidas**: Organizações podem agora exigir que os resultados sejam validados pelo presidente ou administrador antes de contar pontos na classificação ou gerar avanços em mata-matas.
- **Resiliência de Dados**: Adicionadas validações rigorosas em formulários (campos obrigatórios e valores mínimos) para evitar competições com dados nulos ou inválidos.
- **Novo campo Descrição**: Adicionado campo de descrição para competições no banco de dados e UI.

### Changed
- **Configuração de Git**: Pasta `.agent/` adicionada ao `.gitignore` para manter o estado interno do assistente IA fora do controle de versão.
- **Flexibilidade Pré-Torneio**: O organizador agora pode editar todas as configurações da competição (exceto o formato estrutural) durante toda a fase de planejamento e inscrições, sendo estas travadas automaticamente apenas no início oficial dos jogos.
- **UI de Formatos**: Corrigido erro visual onde competições de "Grupos + Mata-mata" eram incorretamente rotuladas como "Pontos Corridos".

### Fixed
- **Permissões de Súmula**: Corrigido erro de "Acesso Negado" que impedia presidentes de clube de iniciar partidas e registrar eventos nos jogos onde sua equipe estava participando, devido a uma falha na resolução de IDs de inscrição.
- **Seleção de Jogadores**: Corrigido problema onde a lista de jogadores aparecia vazia caso o clube não tivesse escalado o elenco para a competição. Agora a UI exibe um alerta claro e link direto para a gestão do elenco.
- **Visibilidade de Elencos**: Implementada lógica que permite presidentes visualizarem o elenco de outras equipes ("Ver Elenco"), enquanto mantêm a permissão de "Gerenciar Elenco" apenas para seus próprios clubes.
- **Formulário de Eventos Dinâmico**: Implementado componente reativo que filtra automaticamente os jogadores com base na equipe selecionada, melhorando a precisão no registro de scouts.

## [0.6.3] - 2026-03-20
### Added
- Notificações automáticas no feed da competição quando uma partida é iniciada ou finalizada.
- Algoritmo de geração de chaves (Mata-mata) para competições com formato eliminatório, incluindo suporte a "Byes" dinâmicos em chaves incompletas.
- Lógica de auto-progressão no mata-mata: vencedores de partidas finalizadas são automaticamente alocados na rodada seguinte de sua chave.
- Componente visual interativo para chaveamento (Knockout Bracket), integrado ao detalhe da competição em nova aba.

## [0.6.2] - 2026-03-20
### Added
- Gestão de tipos de estatísticas (eventos) por modalidade no painel administrativo.
- Registro de eventos na súmula agora utiliza os tipos configurados para a modalidade.

### Changed
- Súmula de partida simplificada: campo de metadados JSON removido para evitar erros.
- Lógica de atualização de placar automática baseada em palavras-chave (Gol, Kill, Ponto, etc).
- Proteção contra registro de eventos em partidas já finalizadas.

## [0.6.1] - 2026-03-21
### Changed
- **Documentação:** Roadmap atualizado para refletir a conclusão da Fase 5 e o início da **Fase 6 (Estatísticas & Dashboards)**.
- **Identificação de Gaps:** Identificada necessidade de gerador de mata-mata e sistema de validação de súmulas para fechamento total da Fase 5.
- **Interface:** Dashboard principal atualizado para refletir o status atual do projeto (Fase 6).

## [0.6.0] - 2026-03-20
### Added
- **Execução de Partidas (Fase 5 - Conclusão):**
  - Implementada **Súmula em Tempo Real** com suporte a polling automático (atualização a cada 10s).
  - Adicionado suporte para **Presidentes de Clube** gerenciarem as súmulas de suas partidas.
  - Implementada **Tabela de Classificação Automática** que calcula pontos, saldo de gols e vitórias dinamicamente.
  - Adicionada **Categorização de Competições** no dashboard:
    - Jogadores e Presidentes de Clube veem primeiro os torneios em que estão inscritos.
    - Presidentes de Organização veem primeiro os torneios de sua própria organização.
    - Nova seção "Explorar Torneios" para as demais competições.
  - Implementada infraestrutura de banco de dados para `matches` e `match_events`.
  - Adicionado suporte a **Geração Automática de Partidas (Round Robin)** para competições de pontos corridos.
  - Nova aba **"Partidas"** no dashboard da competição para visualização do cronograma.
  - Nova aba **"Classificação"** no dashboard da competição.
  - Implementada seção de **"Equipes Participantes"** na visão geral da competição.
  - Funcionalidade de **Iniciar Torneio** que gera a tabela e altera o status para ativo.
- **Seeding & Desenvolvimento:**
  - Script de seed aprimorado para registrar clubes automaticamente em uma competição de teste.
  - População automática de elencos (`competition_rosters`) durante o seed para facilitar testes de súmula.
  - Adicionados tipos de estatísticas padrão para a modalidade Futebol.
- **Busca e Exploração:**
  - Implementado **Filtro de Busca por Nome** nas telas de Jogadores e Clubes com debouncing para performance.
  - Criada a seção **"Explorar Mundo"** na tela de clubes, permitindo descobrir novas organizações com filtros por modalidade.
  - Sincronização de paginação com termos de busca e filtros na URL.
  - Correção de erros de relação no Drizzle ORM para a tabela de clubes e modalidades.

### Fixed
- **Dashboard da Competição:** Corrigidas falhas de sintaxe JSX e erros de tipagem no roteamento de abas.
- **Imports:** Removidos imports duplicados e otimizadas as queries de servidor para incluir partidas e postagens.

## [0.5.0] - 2026-03-20
### Added
- **Configurações de Torneios (Fase 4 - Finalização):**
  - Implementada **Edição de Informações** com restrições baseadas no status do torneio (campos críticos bloqueados após início).
  - Adicionados **Controles Manuais** para abertura de inscrições e janelas de transferência com **modal de confirmação**.
  - Implementado **Feed de Atividades** com mensagens automáticas de sistema e mural de avisos para organizadores.
  - Adicionada funcionalidade de **Fixação (Pin)** para postagens no feed.
  - Nova **Interface em Abas** no detalhe da competição: Geral, Feed e Gestão.
  - Adicionado suporte para **Cronograma de Inscrições** e **Janelas Recorrentes** configuráveis.
- **Gestão de Competições (Admin):**
  - Implementada zona de perigo (`Danger Zone`) na página de detalhes da competição.
  - Ação de exclusão permanente e recursiva.
  - Ação de desativação e reativação.
- **Gestão de Organizações (Admin & Regras):**
  - Implementada `Danger Zone` para organizações (Exclusão e Desativação).
  - Trava de Organização Única e Restrição de Criação de torneios.
- **Mercado de Jogadores:**
  - Implementada paginação (12 jogadores por página).
  - Adicionada a exibição do nome do clube no card do jogador.

### Changed
- **Mercado de Jogadores:** A busca agora acontece automaticamente ao alterar qualquer filtro.

### Fixed
- **Mercado de Jogadores:** Corrigido problema onde a lista de jogadores aparecia vazia.
- **Filtros do Mercado:** Ajustada a lógica de filtragem para modalidade e posição.

### Removed
- **Sidebar:** Removida a opção "Minhas Competições".

## [0.4.0] - 2026-03-14

### Added
- **Organizacões (Refactor):** Transição completa do termo "Ligas" para "Organizações" em todo o sistema.
- **Role Presidente de Organização:** Renomeação do cargo `league_president` para `org_president`.
- **Restrição de Competições:** A criação de competições agora é exclusiva para Presidentes de Organização ou Admins.
- **Wizard de Organização:** Interface para criação e gestão de organizações em `/dashboard/organizations`.

### Changed
- **Lógica de Criação:** Torneios agora devem ser obrigatoriamente vinculados a uma Organização válida.

## [0.3.0] - 2026-03-14

### Added
- **Unificação de Interface:** Fusão da Vitrine e Gestão em `/dashboard/clubs/[id]`.
- **Participação Restrita:** Travas para evitar múltiplos papéis.
- **Saída de Clube:** Funcionalidade voluntária para jogadores.
- **Mercado de Jogadores:** Página central de talentos.

## [0.2.0] - 2026-03-12

### Added
- **Sistema de Posições:** Modalidades agora possuem posições específicas.
- **Vínculo Jogador-Modalidade:** Escolha de posição primária/secundária.
- **Gestão de Clubes (Fase 1):** Criação e fundação de clubes.

## [0.1.0] - 2026-03-10
- Inicialização do projeto Athlon.
- Dashboard básico com autenticação Auth.js.
- Cadastro de modalidades esportivas.
