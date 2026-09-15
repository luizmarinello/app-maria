-- Sprint 2: bloqueio de horário e vários serviços por atendimento.
-- Rode no SQL Editor. Pode rodar mais de uma vez.
alter table appointments drop constraint if exists appointments_status_check;
alter table appointments add constraint appointments_status_check
  check (status in ('agendado','concluido','cancelado','bloqueio'));
alter table appointments add column if not exists items jsonb;
