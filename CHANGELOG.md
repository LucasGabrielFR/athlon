# Changelog

Todas as mudanças notáveis para o projeto **Athlon** serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).

## [Unreleased]
### Added
- **Gestão de Competições (Admin):**
  - Implementada zona de perigo (`Danger Zone`) na página de detalhes da competição.
  - Ação de exclusão permanente e recursiva (deleta inscrições e elencos via cascata no DB).
  - Ação de desativação e reativação de competição (toggle status `deactivated` / `planned`) com confirmação.
  - Travas de segurança via server actions para garantir que apenas administradores executem estas ações.
- **Gestão de Organizações (Admin & Regras):**
  - Implementada `Danger Zone` para organizações (Exclusão e Desativação).
  - Trava de Organização Única: Usuários (incluindo Admin) só podem possuir uma única organização vinculada.
  - Restrição de Criação: Competições só podem ser criadas se o usuário for presidente da organização selecionada.
  - Cascata de Exclusão: Deletar uma organização agora remove recursivamente competições, inscrições e elencos.

### Added
- **Mercado de Jogadores:**
  - Implementada paginação (12 jogadores por página) para melhorar a performance.
  - Adicionada a exibição do nome do clube no card do jogador (quando houver).

### Changed
- **Mercado de Jogadores:** A busca agora acontece automaticamente ao alterar qualquer filtro, eliminando o botão "Filtrar".

### Fixed
- **Mercado de Jogadores:** Corrigido problema onde a lista de jogadores aparecia vazia devido a joins muito restritivos. Agora jogadores sem perfil completo ou modalidade vinculada também são exibidos.
- **Filtros do Mercado:** Ajustada a lógica de filtragem para suportar corretamente a busca por modalidade, posição e status (Free Agent).

### Removed
- **Sidebar:** Removida a opção "Minhas Competições", pois a visualização será feita diretamente na página da organização.

## [0.4.0] - 2026-03-14

### Added
- **Organizacões (Refactor):** Transição completa do termo "Ligas" para "Organizações" em todo o sistema.
- **Role Presidente de Organização:** Renomeação do cargo `league_president` para `org_president`.
- **Restrição de Competições:** A criação de competições agora é exclusiva para Presidentes de Organização ou Admins.
- **Wizard de Organização:** Interface para criação e gestão de organizações em `/dashboard/organizations`.

### Changed
- **Lógica de Criação:** Torneios agora devem ser obrigatoriamente vinculados a uma Organização válida de posse do usuário (ou gerida pelo Admin).
- **Interface de Torneios:** Labels, botões e descrições atualizados de "Ligas" para "Organizações" nas páginas de detalhe, listagem e criação.
- **Segurança (Server Actions):** Reforço de validação no servidor para garantir que o criador de uma competição é o presidente legítimo da organização selecionada.

### Fixed
- **Navegação Sidebar:** Links e ícones corrigidos para refletir as novas rotas de organizações.

## [0.3.0] - 2026-03-14

### Added
- **Unificação de Interface:** A "Vitrine do Clube" e a "Gestão do Clube" foram fundidas em uma única página profissional dentro do Dashboard (`/dashboard/clubs/[id]`).
- **Participação Restrita:** Travas lógicas para evitar múltiplos papéis conflitantes na mesma modalidade.
- **Saída de Clube:** Funcionalidade para jogadores saírem voluntariamente de clubes.
- **Mercado de Jogadores:** Listagem de talentos em `/dashboard/players`.
- **Perfis de Jogadores:** Páginas individuais com biografia e histórico.
- **Convites via Perfil:** Presidentes podem convidar jogadores diretamente de seus perfis.
- **Ambiente de Teste:** Script de seed (`npm run db:seed`) atualizado.

### Changed
- **Navegação Consolidada:** Links externos para clubes agora redirecionam para o ambiente seguro do Dashboard.
- **Visualização de Elenco:** A listagem de jogadores agora utiliza uma tabela profissional com estatísticas de vitórias/derrotas e identificação de cargos (Presidente/Capitão).

## [0.2.0] - 2026-03-12

### Added
- **Sistema de Posições:** Modalidades agora possuem posições específicas (ex: ADC, Mid, Tanker).
- **Vínculo Jogador-Modalidade:** Jogadores agora escolhem sua posição primária e secundária ao entrar em uma modalidade.
- **Gestão de Clubes (Fase 1):** Criação de clubes, upload de logos e definição de localização.
- **Painel do Presidente:** Interface para gerenciar pedidos de entrada e convites enviados.

## [0.1.0] - 2026-03-10
- Inicialização do projeto Athlon.
- Dashboard básico com autenticação Auth.js.
- Cadastro de modalidades esportivas.
