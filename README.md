# Minha Agenda

App de agenda profissional, feito como PWA (React + Vite) com banco hospedado no Supabase.
Instala na tela de início do iPhone e do Android sem passar por loja nenhuma. Você mexe nos
dados pelo celular ou pelo computador (painel do Supabase).

Interface desenhada para iPhone: tipografia do sistema, barras translúcidas, áreas seguras
do notch, modo claro e escuro, e respeito a "reduzir movimento" e "reduzir transparência".

## Telas

| Arquivo | O que é |
|---|---|
| `src/pages/Agenda.jsx` | Agenda do dia, calendário do mês e contadores |
| `src/pages/Agendamento.jsx` | Criar, editar, concluir e excluir agendamento |
| `src/pages/Clientes.jsx` | Clientes, telefone, observações e histórico |
| `src/pages/Ajustes.jsx` | Serviços (nome, duração, valor) |
| `src/pages/Financeiro.jsx` | Faturamento por semana, mês e ano, e por serviço |

Navegação por barra de abas fixa embaixo, no padrão iOS. A tela de agendamento
abre como modal, com "Cancelar" e "Salvar" na barra do topo.

## Passo 1 — criar o banco (uma vez, no computador)

1. Crie uma conta grátis em https://supabase.com e um projeto novo (região: São Paulo).
2. No menu **SQL Editor** → **New query** → cole todo o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. Em **Authentication → Users → Add user**, crie o usuário dela (e-mail e senha, marque
   "Auto confirm user"). É com ele que o app entra.
4. Em **Project Settings → Data API**, copie a **Project URL**, e em **API Keys** a
   **Publishable key**.

O app pede a senha **uma vez só**, na instalação. A sessão fica guardada no aparelho e se
renova sozinha, então a tela de login não volta a aparecer. Isso é necessário porque a chave
publishable fica visível no código do site (vale para qualquer hospedagem estática): sem
login, qualquer pessoa com o endereço conseguiria ler nome e telefone das clientes.

## Passo 2 — configurar o projeto

Copie `.env.example` para `.env` e cole os dois valores do passo anterior:

```bash
cp .env.example .env
```

> O `.env` não vai para o Git.

## Passo 3 — rodar localmente

```bash
npm run dev
```

## Passo 4 — publicar no GitHub Pages

1. Crie o repositório no GitHub e envie o código.
2. Em **Settings → Secrets and variables → Actions → New repository secret**, crie os dois:
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY`, com os mesmos valores do `.env`.
3. Em **Settings → Pages → Build and deployment → Source**, escolha **GitHub Actions**.
4. Pronto. Todo envio para `master` publica sozinho, pelo
   [workflow](.github/workflows/deploy.yml). O endereço fica
   `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

Detalhes já resolvidos no projeto: o `BASE_PATH` do workflow ajusta o caminho do subdiretório,
o `404.html` faz as rotas internas funcionarem (o Pages não reescreve URLs), e o manifesto do
PWA acompanha o mesmo caminho.

## Passo 5 — instalar no iPhone

No iPhone: abra o link no **Safari** (precisa ser o Safari, não o Chrome), toque no botão
Compartilhar e escolha **Adicionar à Tela de Início**. O app passa a abrir em tela cheia,
com ícone próprio e sem barra de navegador. No Android o Chrome oferece "Instalar app".

Atualizações são automáticas: ao publicar uma versão nova, o app pega sozinho na próxima
abertura.

## Passo 6 — mexer pelo computador

No painel do Supabase, **Table Editor** mostra `services`, `clients` e `appointments`
como planilhas: dá para cadastrar serviços, corrigir valores e conferir agendamentos
direto do navegador. As mudanças aparecem no app na próxima abertura da tela.

## Testes

```bash
npm test
```

Confere os cálculos de faturamento, ticket médio e totais por serviço (`lib/report.mjs`).
