# 🏆 Athlon: Plano de Ação & Arquitetura
> *O elo entre o esporte real e o digital.*

---

## 📋 Sumário
- [1. Visão Geral e Estratégia](#-1-visão-geral-e-estratégia)
- [2. Estrutura de Perfis (Roles)](#-2-estrutura-de-perfis-roles)
- [3. Entidades Core](#-3-entidades-core)
- [4. Motor de Competições](#-4-motor-de-competições)
- [5. Modelagem Técnica](#-5-modelagem-técnica)
- [6. Identidade Visual (Design System)](#-6-identidade-visual-design-system)
- [7. Roadmap (Cronograma)](roadmap.md)

---

## 🚀 1. Visão Geral e Estratégia

### 1.1 Descrição Geral
O **Athlon** é uma plataforma de gestão e engajamento para ecossistemas competitivos. Diferente de sistemas de tabelas estáticos, o Athlon funciona como uma rede social de performance, onde a hierarquia de perfis permite que um único usuário transite entre ser um atleta de e-sports, um jogador de futebol de várzea ou o gestor de um clube multigames.

O coração do projeto é o **Motor de Competições Modular**, que permite que organizadores criem regras de negócio específicas para cada torneio, garantindo que o sistema atenda desde um campeonato de bairro até uma liga internacional.

### 💡 1.2 Pilares de Identidade
*   **Multimodalidade Nativa:** Trata "futebol" e "League of Legends" como modalidades com atributos customizáveis.
*   **Perfil Híbrido:** Transição fluida entre ser Jogador e Gestor (Presidente de Clube).
*   **Transparência:** Sistema de *reports* com validação visual (fotos/prints).
*   **Escalabilidade:** Organização geográfica por camadas (Mundo > País > Estado > Cidade).

### 🗺️ 1.3 Roadmap Estratégico
1.  **Core API:** Base agnóstica onde "Gol" e "Kill" são tratados como eventos genéricos.
2.  **Sistema de Pagamentos:** Integração de *escrow* para garantir premiações.
3.  **Dashboards de Performance:** Tradução de dados brutos em histórico profissional.

---

## 👥 2. Estrutura de Perfis (Roles)

| Perfil | Responsabilidade Principal | Regra de Negócio |
| :--- | :--- | :--- |
| **🔐 Admin** | Infraestrutura Global | Gestão de taxas, usuários e suporte. |
| **🏛️ Pres. de Liga** | Arquiteto de Torneios | Cria regras, define premiações e valida resultados. |
| **🛡️ Pres. de Clube** | Gestor de Equipe | Contrata jogadores e inscreve o time em ligas. |
| **👟 Jogador** | Atleta / Competidor | Participa de partidas e acumula estatísticas. |

> [!IMPORTANT]
> **Regra de Ouro:** Todo Presidente de Clube é, obrigatoriamente, um Jogador. Já o Presidente de Liga é um perfil exclusivo para garantir imparcialidade.

---

## 🛡️ 3. Entidades Core

### 👤 3.1 Perfil do Jogador
O jogador possui uma única conta com múltiplas identidades competitivas via **Context Switcher**.

#### **A. Dados de Identidade (Core)**
- Nome Completo, Nickname, Localização, Data de Nascimento.

#### **B. Dados de Modalidade (Dinâmicos)**
- **Vínculo:** `PlayerModality` (Ex: Futebol Real, FIFA, LoL).
- **Plataforma:** (PC, PS5, Presencial).
- **Atributos:** Posição (Goleiro, Mid Laner), Número da camisa, etc.

#### **C. Dashboards**
- **Global Stats:** Agregado de todas as vitórias/derrotas.
- **Hall de Troféus:** Galeria visual de conquistas.

### 🏢 3.2 O Clube (Organização)
Tratado como uma **Organização Multimodal**.

- **Identidade:** Nome, Tag (3 letras), Escudo e Localização.
- **Departamentos:** O clube pode ter times em diferentes modalidades simultaneamente.
- **Gestão de Elenco (Roster):** O Presidente convida jogadores e define quem joga em cada modalidade.

---

## 🎮 4. Motor de Competições

A plataforma utiliza um "Wizard" de criação para Presidentes de Liga configurar:

-   **Formatos:** Pontos Corridos, Mata-mata ou Híbrido.
-   **Regras de Pontuação:** Customizável (Vitória/Empate/Derrota).
-   **Gestão de Elenco na Competição:**
    -   **Limite de Jogadores:** Possibilidade de definir um teto máximo de atletas que podem ser inscritos por clube na competição.
    -   **Janelas de Inscrição:** Configuração de períodos recorrentes para novas inscrições de jogadores (Semanal, Quinzenal, Mensal, etc.), que permanecem ativos até o término do torneio.
-   **Financeiro:** Taxas de inscrição e gestão de *Prize Pool*.
-   **Validação:** Sistema de "Report" onde os clubes enviam provas e a liga valida.

---

## 💻 5. Modelagem Técnica

### 5.1 Arquitetura de Banco de Dados (MySQL)

#### **Camada de Identidade**
- `users`: Core da conta.
- `roles` / `user_roles`: Controle de acesso (RBAC).

#### **Camada de Flexibilidade (Metadados)**
- `modalities`: (Futebol, CS2, Vôlei).
- `positions`: Relacionado à modalidade (Atacante, Líbero).
- `stat_types`: Define o que medir (Gols, Kills, Ace).

#### **Camada Competitiva**
- `clubs`: Organizações gestoras.
- `competitions`: Armazena regras em `rules_json` para máxima flexibilidade.
- `matches`: Registro de confrontos e scores.
- `match_events`: Registro atômico de cada ação (quem fez o gol, minuto, etc).

> [!TIP]
> Use o suporte a **JSON** do MySQL na tabela de competições para regras variáveis e **Indexes** otimizados para dashboards de performance, evitando cálculos pesados em tempo real.

---

## 🎨 6. Identidade Visual (Design System)

### 6.1 Conceito: "O Vértice da Vitória"
Uma letra **'A'** estilizada onde as pernas representam o Esporte Real e o Digital, encontrando-se no ápice (torneio).

### 🌈 6.2 Paleta de Cores

| Categoria | Hex | Nome | Aplicação |
| :--- | :--- | :--- | :--- |
| **Primária** | `#0A192F` | **Midnight Navy** | Fundo (Dark Mode), Sidebars. |
| **Acento** | `#00B4D8` | **Athlon Azure** | Botões, Links, Ícones ativos. |
| **Texto** | `#CAF0F8` | **Digital Ice** | Textos principais no Dark Mode. |
| **Suporte** | `#1E293B` | **Slate Base** | Cards, Inputs, Divisores. |

### 🚥 6.3 Status Semânticos
- **Vitória:** `#10B981` (Emerald)
- **Derrota:** `#EF4444` (Rose)
- **Empate:** `#F59E0B` (Amber)

### 🛠️ 6.4 Variáveis CSS
```css
:root {
  --athlon-navy: #0A192F;
  --athlon-azure: #00B4D8;
  --athlon-ice: #CAF0F8;
  --bg-card: #1E293B;
  --grad-main: linear-gradient(135deg, #0A192F 0%, #00B4D8 100%);
}
```

---
---
*Documento atualizado em: 12 de Março de 2026*

## 🗺️ 7. Roadmap (Cronograma)
Para uma visão detalhada das fases de desenvolvimento, marcos e progresso atual, consulte o documento oficial:

👉 **[Roadmap de Desenvolvimento](roadmap.md)**
