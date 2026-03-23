# 🗺️ Athlon: Roadmap de Desenvolvimento
> *O caminho para construir o elo entre o esporte real e o digital.*

Este roadmap detalha as fases de desenvolvimento do projeto Athlon, permitindo um acompanhamento organizado e modular da evolução da plataforma.

---

## 🏗️ Fase 1: Fundação & Infraestrutura (O Core) ✅
*O foco aqui é preparar o terreno e garantir que as ferramentas base estejam configuradas.*

- [x] **Setup Inicial:** Configuração do Next.js 15, Drizzle ORM e conexão com MySQL via Docker.
- [x] **Ambiente Docker:** Refinamento do `docker-compose` para persistência e performance.
- [x] **Autenticação (Auth):** Login, Registro e recuperação de senha via Auth.js v5.
- [x] **Arquitetura de Roles (RBAC):** Campo `role` no schema + JWT com role na sessão.
- [x] **Layout Base:** Header, Sidebar e aplicação do Design System (Cores/Tipografia).

---

## 👤 Fase 2: Identidade & Modalidades
*Definição do "átomo" do sistema e a flexibilidade técnica para suportar qualquer esporte.*

- [x] **Gestão de Modalidades (Admin):** CRUD para cadastrar esportes (Futebol, LoL, etc).
- [x] **Dicionário Técnico:** Schema de Posições e Tipos de Estatísticas por modalidade.
- [x] **Perfil do Jogador:** Cadastro de dados core e `PlayerProfile` dinâmico.
- [x] **Context Switcher:** Interface para o jogador alternar entre modalidades.

---

## 🛡️ Fase 3: Organizações & Clubes
*Transformação do Jogador em Gestor e a criação da estrutura de equipes.*

- [x] **Criação de Clubes:** Fluxo de fundação e atribuição da role "Presidente de Clube".
- [x] **Gestão de Elenco (Roster):** Sistema de convites, aceites e dispensa de jogadores.
- [x] **Departamentos de Clube:** Vínculo de jogadores a modalidades específicas dentro do clube.
- [x] **Vitrine do Clube:** Página pública do clube com escudo e histórico básico.

---

## 🏛️ Fase 4: Gestão Administrativa & Travas ✅
*Onde a mágica da competição acontece.*

- [x] **Renomeação de Ligas:** Transição completa de "Ligas" para "Organizações".
- [x] **Presidentes de Organização:** Novo papel com permissões exclusivas de criação.
- [x] **Restrição de Criação:** Apenas Presidentes de Organização ou Admins podem abrir competições.
- [x] **Wizard de Criação:** Fluxo unificado associando o torneio obrigatoriamente a uma Organização.
- [x] **Gestão Administrativa (Admin):** Exclusão recursiva e desativação de competições e federações.
- [x] **Regras & Travas:** Organização única por usuário e restrição de criação de torneios.
- [x] **Customização de Inscrições:**
    - [x] Limite máximo de jogadores por equipe participante.
    - [x] Configuração de janelas de inscrição recorrentes.
    - [x] Edição de Informações da Competição (com travas de estado).
    - [x] Controles Manuais de Janelas e Inscrições.
    - [x] Feed de Histórico e Postagens de Organizadores.


---

## 🎮 Fase 5: Execução de Partidas & Súmula ✅
*O dia do jogo e a coleta de dados.*

- [x] **Gerador de Tabelas (Round Robin):** Algoritmo para criar a ordem dos jogos em pontos corridos.
- [x] **Gerador de Mata-mata (Bracket):** Lógica para chaves de eliminação simples e dupla.
- [x] **Report de Resultados (Súmula):** Interface para registro de placares e eventos em tempo real.
- [x] **Eventos de Partida:** Registro atômico de Gols, Kills, Cartões, etc.
- [x] **Validação & Disputa:** Fluxo de contestação e aprovação final dos resultados pela organização.

---

## 📊 Fase 6: Estatísticas & Dashboards ✅
*Transformando dados em valor e visibilidade.*

- [x] **Estatísticas por Torneio e Global:** Processamento das estatísticas acumuladas (Artilharia, Assists).
- [x] **Líderes da Competição:** Aba de estatísticas individuais dentro de cada torneio.
- [x] **Dashboard do Jogador 2.0:** Gráficos de evolução, histórico de partidas e cards dinâmicos.
- [x] **Ranking de Clubes:** Classificação global e regional por pontos de prestígio.
- [x] **Hall de Troféus:** Galeria visual de conquistas coletivas e individuais.

---

## ⚽ Fase 7: Comunicação & Engajamento (Futebol-First) 🚧
*Foco total em atrair usuários e criar comunidade, com especialização para FC, Pro Clubs e Futebol Real.*

- [ ] **Infraestrutura AWS S3:** Setup do bucket escalável para armazenamento de mídia.
- [ ] **Uploads de Identidade (Free):** Fotos de perfil, escudos de clubes e logos de organizações.
- [ ] **Camada PRO de Mídia:** Upload de imagens em posts, artes de elenco e comprovantes de súmula restritos a assinantes PRO.
- [ ] **Notificações Integradas:** Alertas via Web Push/Email para convites, janelas de transferência e início de jogos.
- [ ] **Integridade por Imagem (PRO):** Anexo de screenshots ("prints") na súmula das partidas para validação.
- [ ] **Feed Interativo:** Comentários, reações e postagens (com imagens para PRO).
- [ ] **Mercado Proativo:** Jogadores podem marcar status como "Buscando Clube" (Free Agent).

---

## 💎 Fase 8: Athlon PRO & Ecossistema 🚧
*Recursos avançados para quem quer elevar o nível, estruturado como addons premium.*

- [ ] **PRO Player (Deep Analytics):** Gráficos avançados, comparativo de ratings e PDF de currículo esportivo exportável.
- [ ] **PRO Club (Branding & Recrutamento):** Cores customizadas no perfil, filtros de mercado premium e relatórios de performance de elenco.
- [ ] **PRO Org (White-Label):** Subdomínio próprio (ex: `liga.athlon.app`) e remoção de branding do Athlon em torneios.
- [ ] **Portal de Patrocínios:** Banners dedicados e visibilidade para parceiros de clubes e ligas no frontend.

---

## 📱 Fase 9: Expansão & Mobile
*Acessibilidade em qualquer lugar.*

- [ ] **Athlon App (PWA/Mobile):** Experiência nativa para smartphones (iOS/Android).
- [ ] **API Pública/Widgets:** Para que ligas e clubes exibam seus dados em sites externos.

---

## 📅 Status Atual
| Fase | Status | Progresso |
| :--- | :--- | :--- |
| **Fase 1** | ✅ Concluída | 100% |
| **Fase 2** | ✅ Concluída | 100% |
| **Fase 3** | ✅ Concluída | 100% |
| **Fase 4** | ✅ Concluída | 100% |
| **Fase 5** | ✅ Concluída | 100% |
| **Fase 6** | ✅ Concluída | 100% |
| **Fase 7** | 🚧 Planejando | 0% |
| **Fase 8** | ⏳ Futuro | 0% |

---
*Roadmap sujeito a ajustes conforme a evolução do projeto.*
