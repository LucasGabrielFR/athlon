# Proposta de Stack Tecnológica: Athlon

Este plano detalha a arquitetura sugerida para o projeto Athlon, unindo os requisitos do usuário (React, MySQL, Tailwind) com as necessidades de performance e flexibilidade descritas no [action-plan.md](file:///d:/Programming/athlon/action-plan.md).

## User Review Required

> [!IMPORTANT]
> **Next.js vs React Puro:** Para uma plataforma competitiva com dashboards e SEO, o **Next.js 15** (com App Router) é altamente recomendado sobre o Vite/React puro, pois já inclui roteamento, API integrada e otimizações de performance out-of-the-box.
>
> **ORM Drizzle:** Sugerimos o **Drizzle ORM** em vez do Prisma para melhor performance com MySQL e tipagem TypeScript nativa e leve.

## Proposed Stack

### 🌑 1. Frontend & Design (The "Wow" Factor)
- **Framework:** [Next.js 15](https://nextjs.org/) (React).
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) para customização total.
- **Componentes:** [Shadcn UI](https://ui.shadcn.com/) (baseado em Tailwind e Radix UI) para um visual premium e acessível.
- **Ícones:** Lucide React.
- **Animações:** Framer Motion para micro-interações suaves.

### ⚙️ 2. Backend & Data
- **Linguagem:** TypeScript (Fullstack).
- **Banco de Dados:** **MySQL 8.0** via Docker.
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) - Gerencia migrações e consultas type-safe.
- **Validação:** Zod para garantir que os dados de "Reports" e scores estejam corretos.

### 🐳 3. Infraestrutura Local
- **Docker Compose:** Orquestração do MySQL adminer (opcional para visualização).

## Proposed Changes

### [NEW] [docker-compose.yml](file:///d:/Programming/athlon/docker-compose.yml)
Configuração inicial do banco de dados.

### [NEW] [package.json](file:///d:/Programming/athlon/package.json)
Dependências iniciais do projeto Next.js.

### [NEW] [drizzle.config.ts](file:///d:/Programming/athlon/drizzle.config.ts)
Configuração do ORM para o MySQL.

## Estrutura de Diretórios Sugerida

```text
athlon/
├── src/
│   ├── app/           # Rotas e Páginas (Next.js)
│   ├── components/    # Componentes UI (Shadcn + Custom)
│   ├── db/            # Schema do Drizzle e Conexão MySQL
│   ├── services/      # Lógica de negócio (Competition Engine)
│   └── lib/           # Utilitários (validadores, etc)
├── docker-compose.yml
└── drizzle.config.ts
```

## Verification Plan

### Automated Tests
- `npm run dev`: Verificar se o Next.js inicializa corretamente.
- `docker-compose up -d`: Validar se o MySQL inicia e aceita conexões.
- `npx drizzle-kit generate`: Testar a geração do schema inicial.

### Manual Verification
- Acessar `localhost:3000` e validar o tema "Midnight Navy".
- Conectar ao MySQL via VS Code ou Adminer para validar tabelas core.
