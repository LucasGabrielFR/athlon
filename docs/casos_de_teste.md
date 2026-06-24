# Plano de Casos de Teste (QA) — Athlon

> **Versão:** 1.0 · **Revisão:** Março 2026
>
> Este documento define o conjunto de casos de teste manuais (End-to-End) desenhados para garantir a cobertura completa da plataforma Athlon. Utilize este guia para verificar se os fluxos core do sistema estão funcionando conforme o esperado.

---

## Sumário de Módulos
1. [Módulo 1: Autenticação e Perfil](#módulo-1-autenticação-e-perfil)
2. [Módulo 2: Gestão de Clubes e Elenco](#módulo-2-gestão-de-clubes-e-elenco)
3. [Módulo 3: Organizações e Competições](#módulo-3-organizações-e-competições)
4. [Módulo 4: Súmulas Inteligentes e Partidas](#módulo-4-súmulas-inteligentes-e-partidas)
5. [Módulo 5: Comunicação, Mercado e UX](#módulo-5-comunicação-mercado-e-ux)

---

## Módulo 1: Autenticação e Perfil

### CT-1.1: Registro e Login Simples
- **Pré-condição:** Usuário não autenticado na página inicial.
- **Passos:** 
  1. Acessar `/auth/register` e preencher os dados.
  2. Confirmar o registro.
  3. Fazer login com a conta recém-criada.
- **Resultado Esperado:** O usuário é redirecionado para o `/dashboard`. Nenhuma role avançada (como `admin` ou `org_president`) deve ser atribuída por padrão.

### CT-1.2: Status "Free Agent" e Edição de Perfil
- **Pré-condição:** Usuário logado acessando seu próprio perfil.
- **Passos:**
  1. Navegar até o Perfil do Usuário e acessar as opções de uma Modalidade.
  2. Alterar o status para "Buscando Clube" (Free Agent) e adicionar uma mensagem ("LFP - Jogo de Volante").
  3. Salvar as alterações.
- **Resultado Esperado:** Os dados devem ser salvos sem erros e o indicador visual de Free Agent deve aparecer ativo no perfil do jogador.

---

## Módulo 2: Gestão de Clubes e Elenco

### CT-2.1: Fundação de Clube
- **Pré-condição:** Usuário logado que não excedeu o limite de clubes.
- **Passos:**
  1. Acessar a aba "Clubes" e clicar em "Criar Novo Clube".
  2. Preencher Nome, Sigla (Tag), e vincular a uma Modalidade.
  3. Fazer upload do escudo (que irá testar o Cloudflare R2) e submeter.
- **Resultado Esperado:** O clube é criado com sucesso. O usuário que criou deve receber automaticamente a função de "Presidente de Clube" na entidade recém-criada.

### CT-2.2: Gestão de Elenco (Adição/Remoção)
- **Pré-condição:** Usuário logado como Presidente de Clube, e existir outro jogador no sistema.
- **Passos:**
  1. Acessar a Gestão do Clube > Elenco.
  2. Enviar um convite para um jogador.
  3. Com o jogador aceitando, voltar à Gestão do Clube e remover ("Dispensar") o jogador.
- **Resultado Esperado:** O convite deve ser enviado, e a remoção deve atualizar o banco de dados desvinculando o jogador imediatamente do clube.

---

## Módulo 3: Organizações e Competições

### CT-3.1: Fundação de Torneio e Configuração
- **Pré-condição:** Usuário com permissão de `org_president`.
- **Passos:**
  1. Acessar a Organização e clicar em "Nova Competição".
  2. Configurar o torneio para "Pontos Corridos".
  3. Configurar a Pontuação (Vitória=3, Empate=1).
  4. Utilizar o sistema *Drag-and-Drop* para alterar os critérios de desempate.
- **Resultado Esperado:** A competição deve ser criada, mantendo rigorosamente os critérios de pontuação e desempate configurados.

### CT-3.2: Inscrições e Geração de Chaves
- **Pré-condição:** Ter uma competição no estado "Aberto para Inscrições" e ter clubes para inscrever.
- **Passos:**
  1. Um Presidente de Clube se inscreve no torneio.
  2. O Presidente da Organização aprova a inscrição.
  3. O Presidente da Organização encerra a janela de inscrições e clica em **"Iniciar Torneio"**.
- **Resultado Esperado:** O status da competição muda para `in_progress`. A tabela de partidas (Round Robin ou Bracket) deve ser gerada e distribuída uniformemente pelas rodadas, e a aba "Classificação" deve ser criada.

---

## Módulo 4: Súmulas Inteligentes e Partidas

### CT-4.1: Submissão de Partida (Súmula)
- **Pré-condição:** Competição em andamento; Política de Acordo Mútuo configurada, partida pendente entre Clube A e Clube B.
- **Passos:**
  1. O Presidente do Clube A acessa a aba "Súmula" da partida.
  2. Registra eventos em tempo real (1 Gol para o Clube A, 1 Cartão para Clube B).
  3. Preenche o Placar Final.
  4. Faz o upload das imagens obrigatórias (ex: "Print do Lobby") e submete.
- **Resultado Esperado:** As imagens são enviadas ao R2. A partida muda para o status `submitted_by_home`. O placar é travado para o Clube A. O Presidente do Clube B recebe uma notificação global no sistema.

### CT-4.2: Validação via Acordo Mútuo
- **Pré-condição:** Partida no status `submitted` aguardando resposta do adversário.
- **Passos:**
  1. Presidente do Clube B abre a súmula.
  2. Analisa as fotos e o placar enviado pelo Clube A.
  3. Clica em "Aceitar Resultado".
- **Resultado Esperado:** A partida muda para `validated`. A tabela de classificação, os artilheiros e o feed da competição recebem os dados consolidados da partida em tempo real.

### CT-4.3: Disputa (Contestação) e Admin
- **Pré-condição:** Mesma anterior, mas Clube B decide "Contestar".
- **Passos:**
  1. Clube B clica em "Contestar" na súmula enviada por A.
  2. A partida vai para o status `disputed`.
  3. O Administrador acessa a partida, sobrepõe a decisão e finaliza forçadamente.
- **Resultado Esperado:** Os clubes perdem o controle da súmula disputada. Somente o salvamento do Admin avança a partida para `validated`.

---

## Módulo 5: Comunicação, Mercado e UX

### CT-5.1: Notificações In-App
- **Pré-condição:** Dois usuários ativos.
- **Passos:**
  1. O Usuário A envia um convite de clube para o Usuário B.
  2. O Usuário B, com a página aberta, observa o cabeçalho.
- **Resultado Esperado:** O ícone do "Sininho" deve exibir o "badge" com o número de notificações não lidas e um alerta sutil pode aparecer na tela (sem refresh de página).

### CT-5.2: Filtros do Mercado Livre
- **Pré-condição:** Alguns jogadores registrados com a flag "Free Agent".
- **Passos:**
  1. Acessar `/dashboard/market`.
  2. Acionar a chave "Buscar apenas Free Agents".
  3. Filtrar por Modalidade (Ex: Futebol).
- **Resultado Esperado:** A lista deve reagir instantaneamente (debounce), exibindo apenas os jogadores da modalidade selecionada que possuem a tag visual de "Buscando Clube".

### CT-5.3: Troca de Temas (Dark Mode)
- **Pré-condição:** Qualquer página do sistema.
- **Passos:**
  1. Clicar no ícone de Sol/Lua no topo (Header).
- **Resultado Esperado:** Toda a paleta do sistema transiciona nativamente para o modo escuro (ou claro). O estado deve persistir mesmo se a página for recarregada.
