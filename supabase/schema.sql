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

-- Só quem estiver logado lê ou escreve. A chave publishable fica visível no
-- código do site, então é o login que protege os dados das clientes.
-- Crie o usuário em Authentication > Users > Add user.
alter table services     enable row level security;
alter table clients      enable row level security;
alter table appointments enable row level security;

do $$
declare t text;
begin
  foreach t in array array['services','clients','appointments'] loop
    execute format('drop policy if exists %I on %I', t||'_open', t);
    execute format('drop policy if exists %I on %I', t||'_authenticated', t);
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true)',
      t||'_open', t);
  end loop;
end $$;
