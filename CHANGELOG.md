# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-03-12

### Added
- Campo `isActive` na tabela de modalidades para suporte a soft-delete (Desativação).
- Modal de confirmação para desativar modalidades, evitando deleções acidentais.
- Funcionalidade de edição de modalidades existentes via modal interativo.
- Gestão de posições: agora é possível adicionar posições específicas no ato do cadastro ou gerenciar posições de modalidades existentes.
- Filtro de visualização para modalidades "Ativas" e "Inativas".

### Changed
- Estrutura de rotas internas corrigida: `/dashboard/admin/modalities` e `/dashboard/profile` agora seguem a arquitetura de Route Groups do Next.js.
- UI refinada: Seleção de tipo (Coletivo/Individual) e switches interativos foram remodelados com design premium e animações.
- Lógica de posições: campos de posições são ocultados automaticamente para modalidades individuais.

### Removed
- Exclusão permanente de modalidades (substituída pelo sistema de desativação/reativação).

## [0.2.0] - 2026-03-12

### Added
- Tabelas de banco de dados: `positions`, `stat_types`, `player_profiles`, `player_modalities`.
- Server Actions para CRUD de modalidades (protegido por role `admin`).
- Página `/dashboard/admin/modalities`: gestão completa de modalidades com formulário e listagem.
- Página `/dashboard/profile`: edição de dados pessoais (nome, bio, avatar) e gestão de modalidades praticadas.
- Context Switcher: jogador pode definir uma modalidade ativa, exibida no Header.
- Sidebar atualizada com seção "Admin" visível apenas para usuários com role `admin`.
- Identidade visual integrada: logos oficiais da pasta `identidade-visual` aplicados em toda a UI.
- Registro de conta agora inclui seleção de papel: Jogador ou Presidente de Liga.

## [0.1.0] - 2026-03-12

### Added
- Setup inicial do projeto com Next.js 15, Drizzle ORM e MySQL via Docker.
- Sistema de autenticação (Auth.js v5) com login, registro e recuperação de senha.
- Arquitetura de Roles (RBAC) integrada ao schema e sessão JWT.
- Layout base responsivo com Header, Sidebar e Design System ("Vértice da Vitória").
- Documentação detalhada: Plano de Ação, Arquitetura e Roadmap.
