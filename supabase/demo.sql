-- Dados de demonstração. Nomes e telefones são fictícios.
-- Rode no SQL Editor do Supabase. Datas são relativas a hoje.
-- Para apagar tudo depois, rode o bloco "LIMPEZA" no fim do arquivo.

-- Serviços (não duplica se já existir com o mesmo nome)
insert into services (name, duration_min, price)
select v.name, v.duration_min, v.price
from (values
  ('Manutenção',          90,   90.00),
  ('Banho de Gel',        60,   85.00),
  ('Alongamento em Gel', 120,  180.00),
  ('Esmaltação em gel',   60,   60.00),
  ('Spa dos pés',         50,   70.00)
) as v(name, duration_min, price)
where not exists (select 1 from services s where s.name = v.name);

-- Clientes de demonstração
insert into clients (name, phone, notes) values
  ('Ana Beatriz',  '(11) 90000-0001', 'demo · prefere formato amendoado'),
  ('Camila Rocha', '(11) 90000-0002', 'demo · alergia a acetona pura'),
  ('Fernanda Lima','(11) 90000-0003', 'demo'),
  ('Juliana Alves','(11) 90000-0004', 'demo · gosta de nude rosado'),
  ('Larissa Souza','(11) 90000-0005', 'demo'),
  ('Patrícia Melo','(11) 90000-0006', 'demo · vem sempre às quintas');

-- Agendamentos: passados concluídos, hoje, e os próximos dias
with c as (select id, name from clients where notes like 'demo%'),
     s as (select id, name, duration_min, price from services),
     tz as (select 'America/Sao_Paulo'::text as z),
     plano(cliente, servico, dias, hora, status) as (values
       -- semanas passadas (entram no financeiro)
       ('Ana Beatriz',   'Manutenção',         -20, '10:00', 'concluido'),
       ('Camila Rocha',  'Alongamento em Gel', -18, '14:00', 'concluido'),
       ('Juliana Alves', 'Banho de Gel',       -15, '09:00', 'concluido'),
       ('Larissa Souza', 'Esmaltação em gel',  -12, '16:00', 'concluido'),
       ('Patrícia Melo', 'Manutenção',          -9, '11:00', 'concluido'),
       ('Fernanda Lima', 'Spa dos pés',         -7, '15:00', 'concluido'),
       ('Ana Beatriz',   'Banho de Gel',        -6, '10:00', 'concluido'),
       ('Juliana Alves', 'Manutenção',          -2, '13:00', 'concluido'),
       ('Camila Rocha',  'Esmaltação em gel',   -1, '17:00', 'cancelado'),
       -- hoje
       ('Larissa Souza', 'Manutenção',           0, '09:00', 'concluido'),
       ('Patrícia Melo', 'Banho de Gel',         0, '13:00', 'agendado'),
       ('Fernanda Lima', 'Alongamento em Gel',   0, '15:30', 'agendado'),
       -- próximos dias
       ('Ana Beatriz',   'Manutenção',           1, '10:00', 'agendado'),
       ('Camila Rocha',  'Banho de Gel',         2, '14:00', 'agendado'),
       ('Juliana Alves', 'Esmaltação em gel',    3, '11:00', 'agendado'),
       ('Larissa Souza', 'Spa dos pés',          6, '16:00', 'agendado'),
       ('Patrícia Melo', 'Manutenção',           9, '13:00', 'agendado')
     )
insert into appointments (client_id, client_name, service_id, service_name, starts_at, duration_min, price, status)
select c.id, c.name, s.id, s.name,
       ((current_date + p.dias) + p.hora::time) at time zone tz.z,
       s.duration_min, s.price, p.status
from plano p
join c on c.name = p.cliente
join s on s.name = p.servico
cross join tz;

-- LIMPEZA: remove só o que este arquivo criou (clientes marcadas como demo e seus agendamentos).
-- Os serviços ficam, porque são reais.
--
-- delete from appointments where client_id in (select id from clients where notes like 'demo%');
-- delete from clients where notes like 'demo%';
