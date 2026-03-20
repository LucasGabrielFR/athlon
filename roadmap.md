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

## 🎮 Fase 5: Execução de Partidas & Súmula
*O dia do jogo e a coleta de dados.*

- [ ] **Gerador de Chaveamento/Tabelas:** Algoritmo para criar a ordem dos jogos.
- [ ] **Report de Resultados:** Interface para Presidentes de Clube enviarem placares e fotos.
- [ ] **Validação de Súmula:** Fluxo de aprovação pelo Presidente da Organização.
- [ ] **Eventos de Partida:** Registro atômico de Gols, Kills, Cartões, etc.

---

## 📊 Fase 6: Estatísticas & Dashboards
*Transformando dados em valor e visibilidade.*

- [ ] **Cálculo de Performance:** Processamento das estatísticas acumuladas.
- [ ] **Dashboard do Jogador:** Gráficos de evolução e comparativos.
- [ ] **Ranking de Clubes:** Classificação global e regional por modalidade.
- [ ] **Hall de Troféus:** Galeria visual de conquistas coletivas e individuais.

---

## 💎 Fase 7: Financeiro & Expansão
*Refinamento e monetização.*

- [ ] **Integração de Pagamentos:** Checkout para taxas de inscrição.
- [ ] **Prize Pool & Escrow:** Sistema de garantia de premiações.
- [ ] **Notificações em Tempo Real:** Alertas de jogos e notícias da organização.
- [ ] **API Pública/Widgets:** Expandir para que organizações incorporem dados em seus sites.

---

## 📅 Status Atual
| Fase | Status | Progresso |
| :--- | :--- | :--- |
| **Fase 1** | ✅ Concluída | 100% |
| **Fase 2** | ✅ Concluída | 100% |
| **Fase 3** | ✅ Concluída | 100% |
| **Fase 4** | ✅ Concluída | 100% |

---
*Roadmap sujeito a ajustes conforme a evolução do projeto.*
