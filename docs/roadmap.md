# Roadmap de Desenvolvimento — Athlon

> **Versão:** 1.0 · **Revisão:** Março 2026
>
> Este roadmap detalha as fases de desenvolvimento do projeto Athlon, permitindo um acompanhamento organizado e modular da evolução da plataforma.

---

## Visão Geral das Fases

```
FASE 1 A 3 — Core          FASE 4 A 6 — Competições     FASE 7 — Comunicação      FASE 8 A 9 — Expansão
━━━━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━━━    ━━━━━━━━━━━━━━━━━━━━      ━━━━━━━━━━━━━━━━━━━━
Fundação, Auth, Perfil,    Wizard, Súmulas, Tabelas,    AWS S3, Mídia, Feed,      Planos PRO, App Mobile,
Organizações, Elencos      Estatísticas e Troféus       Mercado Proativo          APIs Públicas
━━━━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━━━    ━━━━━━━━━━━━━━━━━━━━      ━━━━━━━━━━━━━━━━━━━━
       CONCLUÍDO                 CONCLUÍDO                 EM ANDAMENTO              FUTURO
```

---

## Fases Concluídas ✅

### 🏗️ Fase 1: Fundação & Infraestrutura
- Setup Next.js 15, Drizzle ORM, MySQL (Docker).
- Autenticação com Auth.js v5.
- Arquitetura de Roles (RBAC) e Layout Base.

### 👤 Fase 2: Identidade & Modalidades
- Gestão Administrativa de Modalidades e dicionário técnico (Posições).
- Perfil do Jogador e Context Switcher.

### 🛡️ Fase 3: Organizações & Clubes
- Criação de Clubes e Gestão de Elenco (Roster).
- Departamentos de Clube e Vitrine pública.

### 🏛️ Fase 4: Gestão Administrativa & Travas
- Papel exclusivo de Presidente de Organização.
- Wizard de criação de competições e restrições de estado.
- Limites de jogadores e cronogramas de inscrição.

### 🎮 Fase 5: Execução de Partidas & Súmula
- Algoritmos geradores de Tabela (Round Robin) e Chaves (Bracket/Mata-Mata).
- Auto-progressão eliminatória e Súmula em Tempo Real com validação.

### 📊 Fase 6: Estatísticas & Dashboards
- Prestígio de Clubes, Líderes de Competição, Evolução de Rating.
- Galeria de Troféus.

---

## Fase em Andamento 🚧

### ⚽ Fase 7: Comunicação & Engajamento (Futebol-First)
*Foco total em atrair usuários e criar comunidade, suportando mídias reais.*

| Status | Tarefa |
| :---: | :--- |
| ✅ | **Feed Interativo:** Curtidas e comentários no feed da competição. |
| ✅ | **Mercado Proativo:** Jogadores podem se marcar como "Buscando Clube" (Free Agent). |
| 🚧 | **Infraestrutura Cloudflare R2:** Setup do bucket S3-compatible para armazenamento de mídia. |
| 🚧 | **Uploads de Identidade:** Fotos de perfil, escudos de clubes, logos de organizações. |
| 🚧 | **Camada PRO de Mídia:** Upload de imagens em posts e artes de elenco. |
| 🚧 | **Integridade por Imagem (PRO):** Anexos ("prints") na súmula das partidas para validação de resultados. |
| 🚧 | **Notificações Integradas:** Alertas via Web Push/Email (convites, jogos, etc). |

---

## Fases Futuras ⏳

### 💎 Fase 8: Athlon PRO & Ecossistema
- **PRO Player:** Deep Analytics e PDF exportável.
- **PRO Club:** Branding customizado, relatórios de performance.
- **PRO Org:** Subdomínio White-Label e gestão de patrocinadores.

### 📱 Fase 9: Expansão & Mobile
- **Athlon App:** PWA / App Nativo (iOS/Android).
- **API Pública / Widgets:** Para sites externos incorporarem tabelas.

---
*Roadmap atualizado conforme a evolução do projeto.*
