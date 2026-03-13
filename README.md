# 🏆 Athlon
> **O elo entre o esporte real e o digital.**

Athlon é uma plataforma modular de gestão e engajamento para ecossistemas competitivos. Unindo a tradição do esporte real com a inovação dos e-sports, o projeto oferece uma infraestrutura completa para jogadores, clubes e ligas.

---

## 🚀 Visão Geral

Diferente de sistemas estáticos, o Athlon funciona como uma **rede social de performance**. Um único usuário pode transitar entre ser um atleta, um gestor de clube ou um organizador de competições, tudo dentro de uma infraestrutura agnóstica de modalidade.

### 💡 Pilares
- **Multimodalidade:** Suporte nativo para qualquer esporte ou game (Futebol, LoL, Vôlei, etc).
- **Escalabilidade:** Estrutura geográfica organizada por camadas (Global > Nacional > Estadual).
- **Integridade:** Sistema de validação de resultados via comprovação visual.

---

## 👥 Perfis de Usuário

- **🔐 Admin:** Gestão de infraestrutura e regras globais.
- **🏛️ Presidente de Liga:** Arquiteto de competições e moderador de ecossistemas.
- **🛡️ Presidente de Clube:** Gestor de elenco, responsável por fundar o clube e gerenciar convites/pedidos de entrada.
- **👟 Jogador:** O "átomo" do sistema, focado em performance, podendo ingressar em clubes via convites ou solicitações.

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

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm install
   npm run dev
   ```

Acesse `http://localhost:3000` para ver o Athlon em ação.

---

## 📄 Documentação Relacionada
- [Plano de Ação e Arquitetura Detalhada](action-plan.md)

---
*Athlon - Transformando dados em glória.*
