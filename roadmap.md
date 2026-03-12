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

- [ ] **Gestão de Modalidades (Admin):** CRUD para cadastrar esportes (Futebol, LoL, etc).
- [ ] **Dicionário Técnico:** Cadastro de Posições e Tipos de Estatísticas por modalidade.
- [ ] **Perfil do Jogador:** Cadastro de dados core e criação do `PlayerProfile` dinâmico.
- [ ] **Context Switcher:** Interface para o jogador alternar entre modalidades.

---

## 🛡️ Fase 3: Organizações & Clubes
*Transformação do Jogador em Gestor e a criação da estrutura de equipes.*

- [ ] **Criação de Clubes:** Fluxo de fundação e atribuição da role "Presidente de Clube".
- [ ] **Gestão de Elenco (Roster):** Sistema de convites, aceites e dispensa de jogadores.
- [ ] **Departamentos de Clube:** Vínculo de jogadores a modalidades específicas dentro do clube.
- [ ] **Vitrine do Clube:** Página pública do clube com escudo e histórico básico.

---

## 🏛️ Fase 4: Ligas & Motor de Competições
*Onde a mágica da competição acontece.*

- [ ] **Configuração de Ligas:** Role "Presidente de Liga" e criação de entidades federativas.
- [ ] **Wizard de Competição:** Interface passo-a-passo para criar torneios.
- [ ] **Lógica de Formatos:** Implementação de Pontos Corridos e Mata-mata.
- [ ] **Inscrições:** Sistema para clubes solicitarem participação em competições.

---

## 🎮 Fase 5: Execução de Partidas & Súmula
*O dia do jogo e a coleta de dados.*

- [ ] **Gerador de Chaveamento/Tabelas:** Algoritmo para criar a ordem dos jogos.
- [ ] **Report de Resultados:** Interface para Presidentes de Clube enviarem placares e fotos.
- [ ] **Validação de Súmula:** Fluxo de aprovação pelo Presidente da Liga.
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
- [ ] **Notificações em Tempo Real:** Alertas de jogos e notícias da liga.
- [ ] **API Pública/Widgets:** Expandir para que ligas incorporem dados em seus sites.

---

## 📅 Status Atual
| Fase | Status | Progresso |
| :--- | :--- | :--- |
| **Fase 1** | ✅ Concluída | 100% |
| **Fase 2** | 🟢 Próxima | 0% |
| **Fase 3** | ⚪ Planejada | 0% |

---
*Roadmap sujeito a ajustes conforme a evolução do projeto.*
