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
3. Em **Project Settings → API**, copie a **Project URL** e a **Publishable key**.

O app **não tem login**: abre direto na agenda. O acesso ao banco é feito com a chave
`anon`, liberada pelas políticas do `schema.sql`. Em troca da simplicidade, quem tiver a
chave (ou o APK) consegue ler e escrever no banco — ok para um app pessoal que só fica no
celular dela. Para proteger depois: trocar `to anon, authenticated` por `to authenticated`
no `schema.sql`, criar o usuário em **Authentication → Users** e voltar uma tela de login.

## Passo 2 — configurar o projeto

Copie `.env.example` para `.env` e cole os dois valores do passo anterior:

```bash
cp .env.example .env
```

> O `.env` não vai para o Git. A chave publishable é pública por design: ela vai embutida no
> app e qualquer pessoa com o link consegue lê-la. Quem controla o acesso são as políticas do
> `schema.sql`, que hoje estão abertas de propósito (app sem login).

## Passo 3 — rodar localmente

```bash
npm run dev
```

## Passo 4 — publicar e instalar no iPhone

Publique a pasta `dist` em qualquer hospedagem estática (Vercel, Netlify, Cloudflare Pages).
As duas variáveis do `.env` precisam estar configuradas no painel da hospedagem também.

```bash
npm run build
```

No iPhone: abra o link no **Safari** (precisa ser o Safari, não o Chrome), toque no botão
Compartilhar e escolha **Adicionar à Tela de Início**. O app passa a abrir em tela cheia,
com ícone próprio e sem barra de navegador. No Android o Chrome oferece "Instalar app".

Atualizações são automáticas: ao publicar uma versão nova, o app pega sozinho na próxima
abertura.

## Passo 5 — mexer pelo computador

No painel do Supabase, **Table Editor** mostra `services`, `clients` e `appointments`
como planilhas: dá para cadastrar serviços, corrigir valores e conferir agendamentos
direto do navegador. As mudanças aparecem no app na próxima abertura da tela.

## Testes

```bash
npm test
```

Confere os cálculos de faturamento, ticket médio e totais por serviço (`lib/report.mjs`).
