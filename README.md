# 🏆 Athlon
> **O elo entre o esporte real e o digital.**

Athlon é uma plataforma modular de gestão e engajamento para ecossistemas competitivos. Unindo a tradição do esporte real com a inovação dos e-sports, o projeto oferece uma infraestrutura completa para jogadores, clubes e organizações.

---

## 🚀 Visão Geral

Diferente de sistemas estáticos, o Athlon funciona como uma **rede social de performance**. Um único usuário pode transitar entre ser um atleta, um gestor de clube ou um organizador de competições, tudo dentro de uma infraestrutura agnóstica de modalidade.

### 💡 Pilares
- **Multimodalidade:** Suporte nativo para qualquer esporte ou game (Futebol, LoL, Vôlei, etc) com tipos de eventos e estatísticas totalmente customizáveis por modalidade.
- **Escalabilidade:** Estrutura geográfica organizada por camadas (Global > Nacional > Estadual).
- **Integridade:** Sistema de validação de resultados via comprovação visual.
- **Dinamismo Competitivo:** Geração automática de tabelas temporárias (Round Robin) e Chaveamento Eliminatório (Mata-Mata) de forma dinâmica, com suporte a **Configurações Avançadas de Pontuação** e **Hierarquia de Desempate Visiva (Drag-and-Drop)**.

---

## 👥 Perfis de Usuário

- **🔐 Admin:** Gestão de infraestrutura e regras globais.
- **🏛️ Presidente de Organização:** Arquiteto de competições, fundador de federações e moderador de ecossistemas. Possui permissão exclusiva para criação de torneios.
- **🛡️ Presidente de Clube:** Gestor de elenco, responsável por fundar o clube e inscrever equipes em torneios.
- **👟 Jogador:** O "átomo" do sistema, focado em performance, podendo ingressar em clubes e ser escalado para competições.

---

## 🛠️ Stack Tecnológica

O projeto utiliza uma stack moderna focada em performance e tipagem rigorosa:

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Banco de Dados:** [MySQL 8.0](https://www.mysql.com/) via Docker
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Estilização:** [Tailwind CSS 4](https://tailwindcss.com/) com Design System customizado.
- **Ambiente:** Docker Compose

---

## 🎨 Identidade Visual

O conceito **"Vértice da Vitória"** utiliza uma paleta que equilibra a confiança do esporte tradicional com a energia digital:

- **Midnight Navy (`#0A192F`):** Profundidade, fundo e tradição.
- **Athlon Azure (`#00B4D8`):** Velocidade, acionáveis e inovação.
- **Digital Ice (`#CAF0F8`):** Clareza e contraste dinâmico.

---

## 🏁 Instalação e Setup

Siga os passos abaixo para rodar o ambiente de desenvolvimento:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/usuario/athlon.git
   cd athlon
   ```

2. **Suba os containers Docker:**
   ```bash
   docker-compose up -d
   ```

### Como Rodar
1.  **Instalação:** `npm install`
2.  **Scripts de Desenvolvimento:**
    - `npm run dev`: Inicia o servidor Next.js
    - `npx drizzle-kit push`: Sincroniza o schema com o banco MySQL
3.  **Dados de Teste:**
    - `npx tsx --env-file=.env scripts/seed.ts`: Gera 10 clubes e 110 usuários para teste.
    - Veja `list-data.md` para as credenciais.

Acesse `http://localhost:3000` para ver o Athlon em ação.

---

## 📄 Documentação Relacionada
- [Roadmap de Desenvolvimento](roadmap.md)
- [Registro de Mudanças (Changelog)](CHANGELOG.md)

---
*Athlon - Transformando dados em glória.*
