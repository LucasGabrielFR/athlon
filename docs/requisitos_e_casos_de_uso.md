# Mapa de Requisitos e Casos de Uso — Athlon

> **Versão:** 1.0 · **Revisão:** Março 2026 · **Status:** Em desenvolvimento ativo
>
> Este documento cataloga todos os requisitos funcionais, não funcionais e casos de uso identificados para o projeto Athlon.

---

## Sumário
1. [Escopo e Limites do Sistema](#1-escopo-e-limites-do-sistema)
2. [Requisitos Funcionais](#2-requisitos-funcionais)
3. [Casos de Uso Principais](#3-casos-de-uso-principais)

---

## 1. Escopo e Limites do Sistema

| Domínio | Descrição |
| :--- | :--- |
| **Identidade** | Contas unificadas com identidades esportivas múltiplas (Context Switcher). |
| **Clubes** | Criação de organizações multimodais, gestão de elencos e contratos. |
| **Competições** | Organização de torneios com formatos de pontos corridos e eliminatória. |
| **Súmulas e Validação** | Registro atômico de eventos (gols, cartões) com necessidade de aprovação. |
| **Estatísticas** | Líderes de estatísticas, hall de troféus, prestígio de clubes. |
| **Engajamento** | Feed interativo, mercado de agentes livres. |

### 1.1 Atores do Sistema
- **Admin**: Gestão técnica.
- **Presidente de Organização**: Criador exclusivo de competições e federações.
- **Presidente de Clube**: Gestor de equipe e inscrições.
- **Jogador**: Atleta focado em desempenho e resultados.

---

## 2. Requisitos Funcionais

### RF-01 — Autenticação e Perfis
| ID | Requisito |
| :--- | :--- |
| RF-01.1 | O sistema deve possuir roles hierárquicos: Admin, Presidente de Org, Presidente de Clube, Jogador. |
| RF-01.2 | O sistema deve permitir que um jogador possua atributos diferentes (posições) dependendo da modalidade. |

### RF-02 — Clubes e Elenco
| ID | Requisito |
| :--- | :--- |
| RF-02.1 | O sistema deve permitir fundar clubes e associar jogadores através de convites. |
| RF-02.2 | O sistema deve organizar o clube em departamentos (Futebol, E-sports, etc). |
| RF-02.3 | Presidentes de Clube podem editar ou dispensar membros do seu elenco. |

### RF-03 — Competições e Execução
| ID | Requisito |
| :--- | :--- |
| RF-03.1 | Apenas Presidentes de Organização podem criar novos torneios. |
| RF-03.2 | O motor de competições deve gerar tabelas de Round Robin automaticamente. |
| RF-03.3 | O motor de competições deve gerar chaves eliminatórias (bracket) com auto-progressão de vencedores. |
| RF-03.4 | O sistema deve possuir travas de inscrição (limite de jogadores, janelas temporais). |
| RF-03.5 | Configuração avançada de pontuação e critérios de desempate via drag-and-drop. |

### RF-04 — Súmulas e Estatísticas
| ID | Requisito |
| :--- | :--- |
| RF-04.1 | As súmulas de partida devem suportar registro atômico baseado nos tipos de eventos da modalidade (Ex: Gols, Kills). |
| RF-04.2 | Resultados devem passar por validação pelo organizador do torneio. |
| RF-04.3 | O sistema deve acumular pontos de prestígio para clubes baseados em vitórias/empates. |
| RF-04.4 | Exibição de líderes de torneio, gráficos de rating individual e galeria de troféus. |

### RF-05 — Comunicação (Fase 7 e 8)
| ID | Requisito |
| :--- | :--- |
| RF-05.1 | O sistema deve ter um feed interativo em competições (reações, comentários). |
| RF-05.2 | Jogadores podem se declarar "Free Agents" num mercado ativo. |
| RF-05.3 | O sistema deverá suportar upload de provas de súmulas via Cloudflare R2 (Screenshots). |
| RF-05.4 | Notificações push/email sobre jogos e convites. |

---

## 3. Casos de Uso Principais

### UC-01: Criação e Gestão de Competições
**Ator:** Presidente de Organização
**Fluxo Principal:**
1. Cria a organização.
2. Cria o torneio vinculado à organização, definindo regras (Pontos Corridos ou Mata-mata).
3. Abre janelas de inscrição.
4. Ao fechar as inscrições, clica em "Iniciar Torneio", o que gera a tabela automática de jogos.
5. Valida súmulas das partidas.

### UC-02: Execução de Súmula em Tempo Real
**Ator:** Presidente de Clube
**Fluxo Principal:**
1. Acessa a aba de partidas do torneio.
2. Inicia a partida e começa a registrar os eventos via formulário dinâmico que puxa o elenco inscrito.
3. Submete o resultado e aguarda a aprovação final do Presidente da Organização.

### UC-03: Exploração e Mercado
**Ator:** Jogador ou Presidente de Clube
**Fluxo Principal:**
1. Presidente filtra jogadores no "Mercado de Jogadores" buscando a tag "Free Agent".
2. Verifica estatísticas de performance do atleta.
3. Envia convite de recrutamento para seu clube.
