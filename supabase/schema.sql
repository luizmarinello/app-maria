-- Rode este arquivo no Supabase: SQL Editor > New query > cole tudo > Run.

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_min int not null default 60 check (duration_min > 0),
  price numeric(10,2) not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  client_name text not null,               -- guardado junto para histórico não quebrar
  service_id uuid references services(id) on delete set null,
  service_name text not null,
  starts_at timestamptz not null,
  duration_min int not null default 60 check (duration_min > 0),
  price numeric(10,2) not null default 0 check (price >= 0),
  status text not null default 'agendado' check (status in ('agendado','concluido','cancelado')),
  created_at timestamptz not null default now()
);

create index if not exists appointments_starts_at_idx on appointments (starts_at);
create index if not exists appointments_status_idx on appointments (status);

-- App sem login: acesso liberado para a chave anon.
-- Consequência: quem tiver a chave (ou o APK) lê e escreve tudo.
-- Se um dia quiser proteger, troque "to anon, authenticated" por "to authenticated"
-- e volte a tela de login (ver README).
alter table services     enable row level security;
alter table clients      enable row level security;
alter table appointments enable row level security;

do $$
declare t text;
begin
  foreach t in array array['services','clients','appointments'] loop
    execute format('drop policy if exists %I on %I', t||'_open', t);
    execute format(
      'create policy %I on %I for all to anon, authenticated using (true) with check (true)',
      t||'_open', t);
  end loop;
end $$;
