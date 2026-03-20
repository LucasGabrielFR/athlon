# Changelog

Todas as mudanças notáveis para o projeto **Athlon** serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]

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
