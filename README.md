# Minha Agenda

App de agenda profissional (React Native + Expo) com banco hospedado no Supabase.
Um único código roda no Android e no iOS. Você mexe nos dados pelo celular (app) ou pelo
computador (painel do Supabase).

## Telas

| Arquivo | O que é |
|---|---|
| `app/index.js` | Agenda do dia + calendário do mês + contadores |
| `app/agendamento.js` | Criar/editar/concluir/excluir agendamento |
| `app/clientes.js` | Clientes, telefone, observações e histórico |
| `app/configuracoes.js` | Serviços (nome, duração, valor) e sair da conta |
| `app/financeiro.js` | Faturamento por semana/mês/ano e por serviço |

## Passo 1 — criar o banco (uma vez, no computador)

1. Crie uma conta grátis em https://supabase.com e um projeto novo (região: São Paulo).
2. No menu **SQL Editor** → **New query** → cole todo o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
3. Em **Authentication → Users → Add user**, crie o usuário que vai entrar no app
   (e-mail + senha, marque "Auto confirm user"). É esse login que a Maria vai usar.
4. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.

## Passo 2 — configurar o projeto

Copie `.env.example` para `.env` e cole os dois valores do passo anterior:

```bash
cp .env.example .env
```

> O `.env` não vai para o Git. A chave `anon` é pública por design — o que protege os dados
> é o login + as políticas de RLS criadas pelo `schema.sql`.

## Passo 3 — testar no celular (mais simples)

```bash
npx expo start
```

Instale o app **Expo Go** no celular, escaneie o QR Code. Serve para testar, mas exige o
computador ligado na mesma rede.

## Passo 4 — instalar de verdade no celular (APK Android)

```bash
npx eas-cli build -p android --profile preview
```

Na primeira vez ele pede login Expo (conta grátis) e cria o `eas.json`. No fim a Expo
devolve um link: abra no celular, baixe o `.apk` e instale (o Android vai pedir para
permitir "instalar de fonte desconhecida"). Não precisa de Google Play nem pagar nada.

**iOS:** o mesmo código funciona, mas instalar direto no iPhone exige conta Apple Developer
(US$ 99/ano) — sem ela, o app expira em 7 dias. Por isso o build de Android é o caminho agora.

## Passo 5 — mexer pelo computador

No painel do Supabase, **Table Editor** mostra `services`, `clients` e `appointments`
como planilhas: dá para cadastrar serviços, corrigir valores e conferir agendamentos
direto do navegador. As mudanças aparecem no app na próxima abertura da tela.

## Testes

```bash
npm test
```

Confere os cálculos de faturamento, ticket médio e totais por serviço (`lib/report.mjs`).
